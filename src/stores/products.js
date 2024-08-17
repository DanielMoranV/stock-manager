import { createCategory, createProduct, deleteCategory, deleteProduct, deleteUnit, getCategories, getProduct, getProducts, getUnit, getUnits, updateCategory, updateProduct, updateUnit, uploadProducts } from '@/api';
import cache from '@/utils/cache';
import { handleApiRequest } from '@/utils/handleApiRequest';
import { defineStore } from 'pinia';

export const useProductsStore = defineStore('productStore', {
    state: () => ({
        products: cache.getItem('products'),
        product: cache.getItem('product'),
        categories: cache.getItem('categories'),
        category: cache.getItem('category'),
        units: cache.getItem('units'),
        unit: cache.getItem('unit'),
        msg: '',
        status: null,
        loading: false
    }),

    actions: {
        // Categorías
        async createCategory(payload) {
            return handleApiRequest(() => createCategory(payload), 'category', 'category', this);
        },
        async updateCategory(payload, id) {
            return handleApiRequest(() => updateCategory(payload, id), 'category', 'category', this);
        },
        async deleteCategory(id) {
            return handleApiRequest(() => deleteCategory(id), null, null, this);
        },
        async getCategories() {
            return handleApiRequest(getCategories(), 'categories', 'categories', this);
        },
        async getCategoriesComboBox() {
            const data = await handleApiRequest(getCategories(), 'categories', 'categories', this);
            if (data) {
                this.categories = data.map((category) => ({ label: category.name, value: category.id }));
            }
            return this.categories;
        },

        // Unidades
        async getUnits() {
            return handleApiRequest(getUnits(), 'units', 'units', this);
        },
        async getUnit(id) {
            return handleApiRequest(() => getUnit(id), 'unit', 'unit', this);
        },
        async updateUnit(payload, id) {
            return handleApiRequest(() => updateUnit(payload, id), 'unit', 'unit', this);
        },
        async deleteUnit(id) {
            return handleApiRequest(() => deleteUnit(id), null, null, this);
        },
        async getUnitsComboBox() {
            const data = await handleApiRequest(getUnits(), 'units', 'units', this);
            if (data) {
                this.units = data.map((unit) => ({ label: unit.symbol.toUpperCase(), value: unit.id }));
            }
            return this.units;
        },

        // Productos
        async getProducts() {
            return handleApiRequest(getProducts(), 'products', 'products', this);
        },
        async getProduct(id) {
            return handleApiRequest(() => getProduct(id), 'product', 'product', this);
        },
        async createProduct(payload) {
            payload.category_id = payload.category.id;
            payload.unit_id = payload.unit.id;
            return handleApiRequest(() => createProduct(payload), 'product', 'product', this);
        },
        async updateProduct(payload, id) {
            payload.category_id = payload.category.id;
            payload.unit_id = payload.unit.id;
            return handleApiRequest(() => updateProduct(payload, id), 'product', 'product', this);
        },
        async deleteProduct(id) {
            return handleApiRequest(() => deleteProduct(id), 'product', 'product', this);
        },
        async uploadProducts(payload) {
            const dataProducts = payload.map((product) => ({
                code: product.code,
                name: product.name,
                description: product.description,
                category_id: product.category_id,
                unit_id: product.unit_id,
                user_id: product.user_id
            }));

            const requestData = { products: dataProducts };
            return handleApiRequest(() => uploadProducts(requestData), null, null, this);
        }
    }
});
