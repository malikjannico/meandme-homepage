<script setup>
import { useContentStore } from '../stores/content';
import CollectionSection from '../components/CollectionSection.vue';
import BrandsSection from '../components/BrandsSection.vue';
import StoresSection from '../components/StoresSection.vue';
import InspirationSection from '../components/InspirationSection.vue';
import AboutUsSection from '../components/AboutUsSection.vue';

const contentStore = useContentStore();
</script>

<template>
  <div v-if="contentStore.loading" class="loading-screen">
    Lade...
  </div>
  <div v-else class="flex flex-col w-full">
    <CollectionSection />
    <BrandsSection />
    <StoresSection />
    <InspirationSection />
    <AboutUsSection />
  </div>
</template>

<style scoped>
.loading-screen {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-size: 2rem;
    color: #575756;
    font-family: 'Raleway', sans-serif;
}
</style>
