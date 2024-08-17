import { login, logout, me } from '@/api';
import router from '@/router';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('authStore', {
    state: () => ({
        user: cache.getItem('user'),
        msg: {},
        role: 'Invitado',
        returnUrl: '',
        session: false,
        loading: false
    }),
    getters: {
        token(state) {
            if (state.user) {
                return state.user.access_token;
            }
        }
    },
    actions: {
        async login(payload) {
            try {
                const data = await login(payload);
                cache.setItem('user', data);
                this.user = data;
                this.session = true;
                this.loading = true;
            } catch (error) {
                this.msg = error.message;
                this.user = null;
                this.session = false;
            }
        },

        async logout() {
            try {
                const { message } = await logout();
                this.msg = message;
                cache.cleanAll();
                this.user = null;
                this.session = false;
                router.push({ name: 'login' });
                //return this.msg;
            } catch (error) {
                this.msg = error.message;
                return this.msg;
            }
        },
        async me() {
            try {
                const { data } = await me();
                cache.setItem('user', data);
                this.user = data;
                this.session = true;
                this.loading = true;
                return this.user;
            } catch (error) {
                this.msg = error.message;
                this.user = null;
                this.session = false;
                return this.msg;
            }
        }
    }
});
