<script setup>
import { onMounted, computed, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import { useContentStore } from './stores/content';

const contentStore = useContentStore();
const route = useRoute();
const { locale } = useI18n();

const isCmsRoute = computed(() => {
  return route.path.startsWith('/management');
});

function updateMetadata() {
  if (isCmsRoute.value) {
    document.title = 'me & me | Management';
    return;
  }

  const settings = contentStore.settings;
  if (!settings) return;

  const isDe = locale.value === 'de';
  const title = isDe ? settings.meta_title_de : settings.meta_title_en;
  const description = isDe ? settings.meta_description_de : settings.meta_description_en;
  const ogImage = settings.og_image_url;

  if (title) {
    document.title = title;
    document.querySelector('meta[name="title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="twitter:title"]')?.setAttribute('content', title);
  }

  if (description) {
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="twitter:description"]')?.setAttribute('content', description);
  }

  if (ogImage) {
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', ogImage);
    document.querySelector('meta[property="twitter:image"]')?.setAttribute('content', ogImage);
  }
}

watch([() => contentStore.settings, locale, isCmsRoute], () => {
  updateMetadata();
}, { deep: true });

onMounted(async () => {
  await contentStore.fetchAllData();
  updateMetadata();
});
</script>

<template>
  <div class="app-container">
    <Header v-if="!isCmsRoute" />
    <main :class="{ 'cms-main': isCmsRoute }">
      <RouterView />
    </main>
    <Footer v-if="!isCmsRoute" />
  </div>
</template>

<style>
.cms-main {
  padding: 0 !important;
  margin: 0 !important;
}
</style>
