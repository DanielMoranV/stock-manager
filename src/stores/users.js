import { createUser, deleteUser, getUser, getUsers, updateProfileUser, updateUser, uploadUsers } from '@/api';
import cache from '@/utils/cache';
import { handleApiRequest } from '@/utils/handleApiRequest';
import { defineStore } from 'pinia';

export const useUsersStore = defineStore('userStore', {
    state: () => ({
        users: cache.getItem('users'),
        user: null,
        msg: {},
        status: null,
        loading: false
    }),
    actions: {
        async getUsers() {
            const data = await handleApiRequest(getUsers(), 'users', 'users', this);
            if (data) {
                data.forEach((user) => {
                    if (!user.role) {
                        user.role = { name: 'No Asignado' };
                    }
                    if (!user.company) {
                        user.company = { company_name: 'No Asignado' };
                    }
                });
                this.users = data;
            }
            return this.users;
        },

        async createUser(payload) {
            payload.password = payload.dni;
            payload.password_confirmation = payload.dni;
            payload.role = payload.role.name;
            const data = await handleApiRequest(() => createUser(payload), null, 'user', this);
            if (data) {
                const user = await getUser(data.id);
                this.user = user.data;
            }
            return this.user;
        },

        async uploadUsers(payload) {
            const dataUsers = payload.map((user) => ({
                dni: user.dni,
                name: user.name,
                phone: user.phone,
                email: user.email,
                password: user.dni,
                password_confirmation: user.dni,
                role: user.role
            }));

            const requestData = { users: dataUsers };
            return await handleApiRequest(() => uploadUsers(requestData), null, null, this);
        },

        async updateUser(payload, id) {
            return await handleApiRequest(() => updateUser(payload, id), null, 'user', this);
        },

        async updateProfileUser(payload, id) {
            return await handleApiRequest(() => updateProfileUser(payload, id), null, 'user', this);
        },

        async deleteUser(id) {
            return await handleApiRequest(() => deleteUser(id), null, null, this);
        }
    }
});
