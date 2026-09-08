<script setup>
const title = 'About Depth First';
const description =
  'Why this site exists, how the traces are built, and how to add a problem to it.';
const config = useRuntimeConfig();
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: `${config.public.siteUrl}/og.png`,
  twitterCard: 'summary_large_image',
});
</script>

<template>
  <div class="wrap page">
    <section class="hero">
      <p class="kicker">About</p>
      <h1>Traces, not transcripts</h1>
      <p class="sub">
        Reading a solution teaches you that solution. Watching one run teaches you the shape it belongs to.
        Depth First exists for the second thing.
      </p>
    </section>

    <article class="essay">
      <section>
        <h2>How it works</h2>
        <h3>The algorithm runs once, then you scrub it</h3>
        <p>
          Every solution on this site is a real, instrumented implementation. It executes once against
          whatever tree you type in, recording a complete snapshot at each step — the active node, the call
          stack, the explicit stack or queue, the local variables, the line of code responsible, and a
          sentence explaining what just happened.
        </p>
        <p>
          The interface never runs anything. It paints frame number <em>n</em>. That is why you can step
          backwards, jump to any point on the scrubber, and change speed without anything getting out of
          sync — there is no execution to rewind, only an index to move.
        </p>
        <p>
          The same recorded frames drive all four language tabs. Each language declares which line number
          corresponds to each semantic step, so switching from Python to C++ keeps your place in the trace.
        </p>
      </section>

      <section>
        <h2>Adding a problem</h2>
        <h3>One folder, two files</h3>
        <p>
          Problems live in <code>content/problems/&lt;slug&gt;/</code>. <code>algorithms.js</code> holds the
          instrumented solutions and the per-language source with its line anchors;
          <code>index.js</code> holds everything the page renders around them — statement, examples,
          the comparison table, the failure modes, the related problems. Register the module in
          <code>content/index.js</code> and the route, the index page and the sitemap pick it up.
        </p>
        <p>
          The tree layout, the level-order parser, the syntax highlighter and the playback controls are
          generic and shared, so a new tree problem is mostly a matter of writing the recording calls into
          a solution you already know how to write.
        </p>
      </section>

      <section>
        <h2>Credit where it's due</h2>
        <h3>Standing on other people's shoulders</h3>
        <p>
          The problems themselves are LeetCode's. If you want a fast, well-curated ordering of what to
          practise and clear video explanations to go with it, NeetCode is the reference — this site is
          meant to sit alongside that kind of resource, not replace it. What's added here is the step-level
          picture: the thing that is hard to get from a static code block or a talked-over recording.
        </p>
      </section>
    </article>
  </div>
</template>
