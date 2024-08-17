import { createCompany, deleteCompany, getCompanies, getCompany, updateCompany, updateLogoCompany } from '@/api';
import cache from '@/utils/cache';
import { handleApiRequest } from '@/utils/handleApiRequest';
import { defineStore } from 'pinia';

export const useCompaniesStore = defineStore('companyStore', {
    state: () => ({
        companies: cache.getItem('companies'),
        company: cache.getItem('company'),
        msg: {},
        status: null,
        loading: false
    }),
    actions: {
        async getCompanies() {
            return await handleApiRequest(getCompanies(), 'companies', 'companies', this);
        },

        async createCompany(payload) {
            const data = await handleApiRequest(() => createCompany(payload), null, 'company', this);
            if (data) {
                const company = await getCompany(data.id);
                this.company = company.data;
            }
            return this.company;
        },

        async updateCompany(payload, id) {
            return await handleApiRequest(() => updateCompany(payload, id), null, 'company', this);
        },

        async updateLogoCompany(payload, id) {
            return await handleApiRequest(() => updateLogoCompany(payload, id), null, 'company', this);
        },

        async deleteCompany(id) {
            const response = await handleApiRequest(() => deleteCompany(id), null, null, this);
            return response ? response : this.status;
        }
    }
});
