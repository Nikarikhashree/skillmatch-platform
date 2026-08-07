# The Matching Algorithm

## The Claude Embeddings Problem

Anthropic does not sell an embeddings model. Claude is a text generation model, so any project
that claims to do semantic matching "with Claude embeddings" is describing something that does
not exist. Anthropic's own documentation points at Voyage AI as its recommended embeddings
partner.

So the work is split. Voyage, or the local vectoriser, turns text into vectors. Claude does the
part it is actually good at: reading a profile and a brief side by side and writing the reason a
person is or is not a fit. That division is the honest version of the original idea, and it is
worth being able to explain out loud.

`services/embeddingService.js` exposes one interface with two implementations behind it, so the
rest of the code never knows which is live.

## The Local Vectoriser

With no Voyage key, text is turned into a 512 dimension vector by a signed hashing trick:

1. Lower case, strip punctuation, drop stopwords
2. Keep unigrams and bigrams, so "grant writing" survives as a unit
3. Hash each term to a bucket, and hash it again to a sign, which cancels some collisions
4. Add `1 + log(count)`, so a term repeated ten times does not outweigh everything else
5. Normalise to unit length, which makes cosine similarity a plain dot product

It is a bag of words, so it cannot know that "monitoring and evaluation" and "outcomes
reporting" mean the same thing. Real embeddings can. The fallback exists so the platform is
demonstrable offline, not because it is as good.

## The Three Signals

    score = 0.50 * context + 0.35 * skills + 0.15 * practical

**Context, 50 percent.** Cosine similarity between the profile vector and the project vector.
Skills are repeated inside the text used to build each vector, which weights them without
needing a separate field. Cosine runs from minus one to one, so it is rescaled to zero to one
and stretched slightly, because real document pairs cluster in a narrow band and an unstretched
score makes everything look mediocre.

**Skills, 35 percent.** Weighted coverage of what the project asked for. Must haves carry twice
the weight of nice to haves. Each covered skill earns `weight * (0.6 + 0.4 * proficiency/5)`, so
holding a skill at all is most of the credit and depth is the rest. An unlisted skill that is a
substring of a listed one counts at eighty percent, which catches "react" against "react native"
without needing a synonym table.

**Practical, 15 percent.** Starts at one and loses points: 0.35 for an on site project the
person is not near, up to 0.4 proportional to an hours shortfall, and 0.25 for falling under the
stated experience floor. It is a penalty rather than a filter on purpose. A brilliant person who
is two hours short a week should still appear, just lower.

## Why Not Just Cosine Similarity

Because vectors alone are confidently wrong in a way that is hard to argue with. A fundraiser
and a fundraising brief score highly whether or not the person has ever written a trust bid.
Explicit skill coverage catches that, and the practical layer catches the person who is perfect
and unavailable. Three signals also gives the interface something to show, which is the whole
point of the fit bar.

## Explanations

Claude gets the profile, the brief, the three scores and the lists of covered and missing
skills, and is told to name the real overlap, then the biggest gap, in two or three sentences,
and never to invent experience. Passing the scores in matters: without them the model
rationalises whatever it is shown, and the prose drifts from the number next to it.

Without a key, a template assembles the same facts. Less fluent, never wrong, and the interface
labels which one wrote it.

## Known Weaknesses

Skill matching is string based, so "M&E" and "monitoring and evaluation" are different skills
until someone types both. The weights are set by judgement, not learned, because there is no
outcome data yet. Once placements accumulate, the honest next step is to fit the weights against
which matches actually led to a placement, and to hold out a test set rather than trusting the
improvement.
