import { assignRole, getRoles } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useRolesStore = defineStore('rolesStore', {
    state: () => ({
        roles: cache.getItem('roles'),
        msg: {},
        loading: false
    }),
    actions: {
        async getRoles() {
            try {
                const data = await getRoles();
                const roles = data.roles;
                cache.setItem('roles', roles);
                this.roles = roles;
                this.loading = true;
            } catch (error) {
                this.msg = error.message;
                this.roles = null;
            }
            return this.roles;
        },
        async getRolesComboBox() {
            try {
                const { data } = await getRoles();
                const roles = data.map((role) => {
                    return { label: role.name.toUpperCase(), value: role.name };
                });
                cache.setItem('roles', roles);
                this.roles = roles;
                this.loading = true;
            } catch (error) {
                this.msg = error.message;
                this.roles = null;
            }
            return this.roles;
        },
        async assignRole(payload) {
            try {
                this.msg = await assignRole(payload);
            } catch (error) {
                this.msg = error.message;
            }
            return this.msg;
        }
    }
});
