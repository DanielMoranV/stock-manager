// src/stores/crudState.js

import axios from 'axios';

export const useCrudStore = () => ({
    state: () => ({
        loading: false,
        error: null,
        status: null,
        state_code: null
    }),

    actions: {
        async createRecord(table, data) {
            try {
                this.loading = true;
                const response = await axios.post(`/${table}`, data);
                this.status = response.success;
                return response.data;
            } catch (error) {
                this.error = `Error creating record in ${table}: ${error.message}`;
                return this.error;
            } finally {
                this.loading = false;
            }
        },

        async fetchRecords(table) {
            try {
                this.loading = true;
                const response = await axios.get(`/${table}`);
                this.status = response.success;
                return response.data;
            } catch (error) {
                this.error = `Error fetching records from ${table}: ${error.message}`;
                return this.error;
            } finally {
                this.loading = false;
            }
        },
        async fetchRecord(table, id) {
            try {
                this.loading = true;
                const response = await axios.get(`/${table}/${id}`);
                this.status = response.success;
                return response.data;
            } catch (error) {
                this.error = `Error fetching records from ${table}: ${error.message}`;
                return this.error;
            } finally {
                this.loading = false;
            }
        },

        async updateRecord(table, data, id) {
            try {
                this.loading = true;
                const response = await axios.put(`/${table}/${id}`, data);
                this.status = response.success;
                return response.data;
            } catch (error) {
                this.error = `Error updating record in ${table}: ${error.message}`;
                return this.error;
            } finally {
                this.loading = false;
            }
        },

        async deleteRecord(table, id) {
            try {
                this.loading = true;
                const response = await axios.delete(`/${table}/${id}`);
                this.status = response.success;
                return response.data;
            } catch (error) {
                this.error = `Error deleting record in ${table}: ${error.message}`;
                return this.error;
            } finally {
                this.loading = false;
            }
        }
    }
});
