import { createCategory, createProduct, deleteCategory, deleteProduct, getCategories, getCategory, getProduct, getProducts, getUnit, getUnits, updateCategory, updateProduct, uploadProducts } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';
import { useCrudStore } from './crudStore.';

export const useProductsStore = defineStore('productStore', {
    state: () => ({
        ...useCrudStore().state(),
        products: cache.getItem('products'),
        product: cache.getItem('product'),
        categories: cache.getItem('categories'),
        category: cache.getItem('category'),
        units: cache.getItem('units'),
        unit: cache.getItem('unit'),
        msg: ''
    }),

    actions: {
        ...useCrudStore().actions,
        async createCategory(payload) {
            return await this.createRecord('categories', payload);
            try {
                const { data } = await createCategory(payload);
                cache.setItem('category', data);
                this.category = data;
            } catch (error) {
                this.msg = error.message;
                this.category = null;
            } finally {
                return this.category;
            }
        },
        async updateCategory(payload, id) {
            return await this.updateRecord('categories', payload, id);
            try {
                const { data } = await updateCategory(payload, id);
                cache.setItem('category', data);
                this.category = data;
            } catch (error) {
                this.msg = error.message;
                this.category = null;
            } finally {
                return this.category;
            }
        },
        async deleteCategory(id) {
            return await this.deleteRecord('categories', id);
            try {
                const response = await deleteCategory(id);
                return response;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        },
        async getCategories() {
            const response = await this.fetchRecords('categories');
            cache.setItem('categories', response);
            console.log(response);
            return response;
            try {
                const { data } = await getCategories();
                cache.setItem('categories', data);
                this.categories = data;
            } catch (error) {
                this.msg = error.message;
                this.categories = null;
                console.log(error);
            } finally {
                this.loading = false;
                return this.categories;
            }
        },
        async getCategory(id) {
            return await this.fetchRecord('categories', id);
        },
        async getCategoriesComboBox() {
            try {
                const { data } = await getCategories();
                const categories = data.map((category) => {
                    return { label: category.name, value: category.id };
                });
                cache.setItem('categories', data);
                this.categories = categories;
            } catch (error) {
                this.msg = error.message;
                this.categories = null;
                console.log(error);
            } finally {
                this.loading = false;
                return this.categories;
            }
        },

        async getUnitsComboBox() {
            try {
                const { data } = await getUnits();
                const units = data.map((unit) => {
                    return { label: unit.symbol.toUpperCase(), value: unit.id };
                });
                cache.setItem('units', data);
                this.units = units;
            } catch (error) {
                this.msg = error.message;
                this.units = null;
                console.log(error);
            } finally {
                this.loading = false;
                return this.units;
            }
        },
        async getUnits() {
            try {
                const { data } = await getUnits();
                cache.setItem('unit', data);
                this.units = data;
            } catch (error) {
                this.msg = error.message;
                this.units = null;
            } finally {
                this.loading = false;
                return this.units;
            }
        },
        async getUnit() {
            try {
                const { data } = await getUnit();
                cache.setItem('unit', data);
                this.category = data;
            } catch (error) {
                this.msg = error.message;
                this.unit = null;
            } finally {
                this.loading = false;
                return this.unit;
            }
        },
        async getCategory() {
            try {
                const { data } = await getCategory();
                cache.setItem('category', data);
                this.category = data;
            } catch (error) {
                this.msg = error.message;
                this.category = null;
            } finally {
                this.loading = false;
                return this.category;
            }
        },
        async getProducts() {
            try {
                const { data } = await getProducts();
                cache.setItem('products', data);
                this.products = data;
            } catch (error) {
                this.msg = error.message;
                this.products = null;
            } finally {
                this.loading = false;
                return this.products;
            }
        },
        async getProduct(id) {
            try {
                const { data } = await getProduct(id);
                cache.setItem('product', data);
                this.product = data;
            } catch (error) {
                this.msg = error.message;
                this.product = null;
            } finally {
                this.loading = false;
                return this.product;
            }
        },
        async createProduct(payload) {
            try {
                payload.category_id = payload.category.id;
                payload.unit_id = payload.unit.id;
                const { data } = await createProduct(payload);
                data.category = payload.category;
                data.unit = payload.unit;
                cache.setItem('product', data);
                this.product = data;
            } catch (error) {
                console.log(error);
                this.msg = error.message;
                this.product = null;
            } finally {
                return this.product;
            }
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

            try {
                const { data } = await uploadProducts(requestData);
                //this.users.push(...data.success);
                this.msg = data.message;
                return data;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        },
        async updateProduct(payload, id) {
            try {
                payload.category_id = payload.category.id;
                payload.unit_id = payload.unit.id;
                const { data } = await updateProduct(payload, id);
                cache.setItem('product', data);

                this.product = data;
            } catch (error) {
                this.msg = error.message;
                this.product = null;
            } finally {
                this.loading = false;
                return this.product;
            }
        },
        async deleteProduct(id) {
            try {
                const response = await deleteProduct(id);
                return response;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        }
    }
});
