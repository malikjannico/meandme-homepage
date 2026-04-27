<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useContentStore } from '../stores/content';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const contentStore = useContentStore();

const storesTitle = computed(() => {
    return contentStore.getSectionTitle('stores', locale.value);
});

const contactTitle = computed(() => {
    return contentStore.getSectionTitle('contact', locale.value);
});

const activeIndices = ref({});
let storeInterval = null;

const formatText = (text) => {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim() !== '');
};

const startStoreCarousels = () => {
    // Initialize indices
    contentStore.storesData.forEach(store => {
        if (!activeIndices.value[store.id]) {
            activeIndices.value[store.id] = 0;
        }
    });

    storeInterval = setInterval(() => {
        contentStore.storesData.forEach(store => {
            if (store.images && store.images.length > 1) {
                const currentIndex = activeIndices.value[store.id];
                activeIndices.value[store.id] = (currentIndex + 1) % store.images.length;
            }
        });
    }, 8000);
};

onMounted(() => {
    startStoreCarousels();
});

onUnmounted(() => {
    if (storeInterval) clearInterval(storeInterval);
});
</script>

<template>
    <section class="section-container">
        <div class="title-line" id="stores">
            <h2>{{ storesTitle }}</h2>
        </div>
        
        <div class="store-grid">
            <div v-for="store in contentStore.storesData" :key="store.id" class="store-card">
                <div class="store-carousel-wrapper">
                    <div class="store-carousel-inner" 
                         :style="{ transform: `translateX(-${(activeIndices[store.id] || 0) * 100}%)` }">
                        <div v-for="img in store.images" :key="img.id" class="store-carousel-item">
                            <img :src="img.image_url" alt="Store Image">
                        </div>
                    </div>
                </div>
                
                <div class="store-info">
                    <h3 class="mb-2">{{ store.name }}</h3>
                    <p class="address-line">{{ store.address }}</p>
                    <p class="address-line mb-3">{{ store.zip_code }} {{ store.city }}</p>
                    
                    <div class="contact-info mb-4">
                        <p class="phone-number">{{ store.phone_number }}</p>
                    </div>
                    
                    <h4 class="opening-title mb-2">Öffnungszeiten</h4>
                    <div class="opening-hours">
                        <p v-for="(line, idx) in formatText(store.business_hours)" :key="idx">
                            {{ line }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="contact-block">
            <div class="title-line" id="contact">
                <h2>{{ contactTitle }}</h2>
            </div>
            <div class="text-center contact-text" v-if="contentStore.settings">
                <p>{{ contentStore.settings.contact_text_de }}</p>
            </div>
        </div>
    </section>
</template>

<style scoped>
.contact-text p {
    white-space: pre-line;
    font-size: 1.1rem;
    line-height: 1.8;
}

.store-carousel-wrapper {
    width: 100%;
    aspect-ratio: 16/10;
    overflow: hidden;
    border-radius: 0; /* Sharp edges */
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.store-carousel-inner {
    display: flex;
    width: 100%;
    height: 100%;
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.store-carousel-item {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
}

.store-carousel-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.store-info {
    padding: 1rem 0;
}

.store-info h3 {
    font-size: 1.4rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 1rem;
    color: var(--text-color);
}

.address-line {
    font-size: 1.05rem;
    color: var(--text-color);
    line-height: 1.5;
}

.phone-number {
    font-weight: 600;
    font-size: 1.05rem;
    color: var(--text-color);
}

.opening-title {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    color: var(--text-color);
    margin-top: 2rem;
}

.opening-hours p {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--text-color);
}

.contact-block {
    margin-top: 8rem;
    scroll-margin-top: var(--header-height);
    text-align: center;
}

@media (max-width: 768px) {
    .contact-block {
        margin-top: 4rem;
    }
}

.contact-text {
    max-width: 800px;
    margin: 0 auto;
}

.contact-text p {
    white-space: pre-line;
    font-size: 1.1rem;
    line-height: 1.8;
    opacity: 0.9;
}
</style>
