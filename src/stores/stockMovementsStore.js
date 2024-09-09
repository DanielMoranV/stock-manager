import { createEntryStockMovements, getStockMovements } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useStockMomentsStore = defineStore('stockMomentsStore', {
    state: () => ({
        stockMovements: cache.getItem('stockMovements'),
        msg: {},
        status: null,
        loading: false
    }),

    getters: {
        isLoading(state) {
            return state.loading;
        },
        getStockMovements(state) {
            return state.stockMovements;
        }
    },

    actions: {
        async fetchStockMoments() {
            try {
                this.loading = true;
                const { data } = await getStockMovements();
                cache.setItem('stockMovements', data);
                this.stockMovements = data;
            } catch (error) {
                this.msg = error.message;
                this.stockMovements = [];
            } finally {
                this.loading = false;
                return this.stockMovements;
            }
        },
        async createEntryStockMovements(payload) {
            try {
                const { data } = await createEntryStockMovements(payload);
                this.stockMovements.push(data);
                cache.setItem('stockMovements', this.stockMovements);
                return this.stockMovements;
            } catch (error) {
                this.msg = error.message || 'Error al crear el movimiento de stock';
                this.product = null;
                this.status = error.status_code || 500;
                return this.status;
            }
        }
    }
});
