<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useContentStore } from '../stores/content';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const contentStore = useContentStore();

const activeBrandId = ref(null);

const brandsTitle = computed(() => {
    return contentStore.getSectionTitle('brands', locale.value);
});

const handleBrandClick = (brand, event) => {
    if (!brand.homepage_url) return;
    
    // Detect if the user is using a touch device (primary pointer is coarse)
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    
    if (isTouch) {
        if (activeBrandId.value !== brand.id) {
            // First touch on mobile: prevent navigation and show active state
            event.preventDefault();
            activeBrandId.value = brand.id;
        } else {
            // Second touch on the same brand: allow navigation
            activeBrandId.value = null;
        }
    }
};

const handleClickOutside = (event) => {
    if (activeBrandId.value !== null) {
        const isBrandTile = event.target.closest('.brand-tile');
        if (!isBrandTile) {
            activeBrandId.value = null;
        }
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <section class="section-container">
        <div class="title-line" id="brands">
            <h2>{{ brandsTitle }}</h2>
        </div>
        
        <div class="brands-grid">
            <component 
                :is="brand.homepage_url ? 'a' : 'div'"
                v-for="brand in contentStore.brands" 
                :key="brand.id" 
                :href="brand.homepage_url"
                :target="brand.homepage_url ? '_blank' : undefined"
                :rel="brand.homepage_url ? 'noopener noreferrer' : undefined"
                class="brand-tile"
                :class="{ 
                    'is-link': brand.homepage_url,
                    'is-active': activeBrandId === brand.id 
                }"
                @click="handleBrandClick(brand, $event)"
            >
                <div class="brand-logo-container">
                    <img v-if="brand.logo_url" :src="brand.logo_url" :alt="brand.name" class="brand-logo-img" />
                    <div v-else class="logo-placeholder">M&M</div>
                </div>
                <span class="brand-name">{{ brand.name }}</span>
            </component>
        </div>
    </section>
</template>

<style scoped>
.brands-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4rem;
    margin-top: 2rem;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
}

.brand-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 200px;
    transition: transform 0.3s ease;
    text-decoration: none;
    color: inherit;
    -webkit-tap-highlight-color: transparent;
    outline: none;
}

.brand-tile.is-link {
    cursor: pointer;
}

.brand-tile:hover,
.brand-tile.is-active {
    transform: translateY(-5px);
    opacity: 1; /* Override global a:hover opacity 0.7 to show full color */
}

.brand-logo-container {
    width: 160px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px; /* Horizontal padding shrinks square logos to balance visual weight */
    background: rgba(0, 0, 0, 0.02); /* Subtle surface for white-background logos */
    border-radius: 12px;
    margin-bottom: 0.5rem;
    transition: background 0.3s ease;
}

.brand-tile:hover .brand-logo-container,
.brand-tile.is-active .brand-logo-container {
    background: rgba(0, 0, 0, 0.04);
}

.brand-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: grayscale(100%);
    opacity: 0.6;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.brand-tile:hover .brand-logo-img,
.brand-tile.is-active .brand-logo-img {
    filter: grayscale(0%);
    opacity: 1;
}

.brand-name {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-weight: 500;
    opacity: 0.8;
    text-align: center;
}

.logo-placeholder {
    font-family: var(--font-title);
    font-size: 2rem;
    opacity: 0.2;
}

@media (max-width: 768px) {
    .brands-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
    }
}
</style>
