<template>
</template>

<script setup lang="ts">
import { version } from '../package.json'
import { onMounted } from 'vue';

onMounted(() => {
  // Load Google tag (gtag.js) asynchronously
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-4KTYN4E5D4';
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-4KTYN4E5D4');
});

</script>
<script defer src="https://ut.ack20.eu.org/ack20" data-website-id="11a252ea-9430-46bc-84ec-f118318e1844"></script>
