<template>
</template>

<script setup lang="ts">
import { version } from '../package.json'

// Google tag (gtag.js) - moved inside the <script setup> tag
if (process.client) { // Only execute on the client-side
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-4KTYN4E5D4');
}
</script>

<script async src="https://www.googletagmanager.com/gtag/js?id=G-4KTYN4E5D4"></script> 
