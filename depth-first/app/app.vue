<script setup>
const year = new Date().getFullYear();
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>

  <header class="site-header">
    <div class="bar">
      <NuxtLink class="logo" to="/">
        <span class="mark">&lt;/&gt;</span>
        <span>Depth First</span>
      </NuxtLink>
      <nav class="site-nav" aria-label="Main">
        <NuxtLink to="/">Problems</NuxtLink>
        <NuxtLink to="/about">About</NuxtLink>
      </nav>
    </div>
  </header>

  <main id="main">
    <NuxtPage />
  </main>

  <footer class="site-footer">
    <div class="bar">
      <span>Depth First — algorithm traces you can step through. © {{ year }}</span>
      <span>← → to step · space to play/pause · R to restart</span>
    </div>
  </footer>
</template>
