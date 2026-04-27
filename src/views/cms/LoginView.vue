<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
    loading.value = true;
    error.value = '';
    try {
        await authStore.login(email.value, password.value);
        // If login succeeds, the store will be updated and router guard will handle redirection
        // but we can also push explicitly for better UX
        router.push({ name: 'cms-dashboard' });
    } catch (e) {
        console.error('Login error:', e);
        error.value = e.message || 'Ungültige Zugangsdaten';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <div class="cms-logo-text centered">
                    <span class="brand">me&me</span>
                    <span class="product">Content Management System</span>
                </div>
            </div>
            
            <form @submit.prevent="handleLogin" class="login-form">
                <div class="md-text-field">
                    <input type="email" v-model="email" id="login-email" required placeholder=" " />
                    <label for="login-email">{{ t('auth.email') }}</label>
                </div>
                
                <div class="md-text-field">
                    <input type="password" v-model="password" id="login-password" required placeholder=" " />
                    <label for="login-password">{{ t('auth.password') }}</label>
                </div>
                
                <div v-if="error" class="error-msg">{{ error }}</div>
                
                <button type="submit" class="md-button md-button-filled login-btn" :disabled="loading">
                    {{ loading ? 'Anmelden...' : t('auth.submit') }}
                </button>
            </form>
            
            <RouterLink to="/" class="back-link">
                {{ t('auth.back_to_home') }}
            </RouterLink>
        </div>
    </div>
</template>

<style scoped>
.login-container {
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--md-surface-container);
    font-family: var(--md-font-sans);
}

.login-card {
    width: 100%;
    max-width: 400px;
    padding: 48px 40px 36px;
    background: var(--md-surface);
    border-radius: 12px;
    border: 1px solid var(--md-outline-variant);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.login-header {
    margin-bottom: 2.5rem;
}

.cms-logo-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.cms-logo-text.centered {
    align-items: center;
    text-align: center;
}

.cms-logo-text .brand {
    font-family: var(--md-font-sans);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--md-primary);
    letter-spacing: -0.02em;
    line-height: 1;
}

.cms-logo-text .product {
    font-family: var(--md-font-sans);
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--md-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    line-height: 1.4;
}

.login-form {
    width: 100%;
}

.login-form .md-text-field {
    margin-bottom: 1.25rem;
}

.login-btn {
    width: 100%;
    height: 40px;
    border-radius: 20px;
    font-size: 0.875rem;
    margin-top: 8px;
}

.error-msg {
    font-family: var(--md-font-sans);
    color: var(--md-error);
    font-size: 0.8125rem;
    margin-bottom: 12px;
    text-align: center;
    padding: 8px 16px;
    background: #fce8e6;
    border-radius: 8px;
}

.back-link {
    margin-top: 24px;
    font-family: var(--md-font-sans);
    font-size: 0.8125rem;
    color: var(--md-primary);
    text-decoration: none;
    font-weight: 500;
}

.back-link:hover {
    text-decoration: underline;
}
</style>
