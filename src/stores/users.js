import { createUser, deleteUser, fetchUsers, getUser, updateProfileUser, updateUser, uploadUsers } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useUsersStore = defineStore('userStore', {
    state: () => ({
        users: cache.getItem('users'),
        user: cache.getItem('user'),
        msg: {},
        status: null,
        loading: false
    }),
    getters: {
        getUsers(state) {
            return state.users;
        }
    },
    actions: {
        async fetchUsers() {
            try {
                const { data } = await fetchUsers();
                cache.setItem('users', data);
                data.forEach((user) => {
                    if (!user.role) {
                        user.role = { name: 'No Asignado' };
                    }

                    if (!user.company) {
                        user.company = { company_name: 'No Asignado' };
                    }
                });
                this.users = data;
                this.loading = true;
            } catch (error) {
                this.msg = error.message;
                this.users = null;
            }
            return this.users;
        },
        async createUser(payload) {
            try {
                payload.password = payload.dni;
                payload.password_confirmation = payload.dni;
                payload.role = payload.role.name;
                const { data } = await createUser(payload);
                const user = await getUser(data.id);
                this.user = user.data;
            } catch (error) {
                this.msg = error.message;
                this.user = null;
                this.status = error.status_code;
                return this.status;
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

            try {
                const { data } = await uploadUsers(requestData);
                //this.users.push(...data.success);
                this.msg = data.message;
                return data;
            } catch (error) {
                this.msg = error.message;
                this.users = null;
                this.status = error.status_code;
                return this.status;
            }
        },
        async updateUser(payload, id) {
            try {
                const { data } = await updateUser(payload, id);
                cache.setItem('user', data);
                this.user = data;
                return this.user;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        },
        async updateListUser(payload, id) {
            // Encuentra el índice del usuario en la lista de usuarios almacenada en `this.users`
            const userIndex = this.users.findIndex((user) => user.id === id);

            if (userIndex !== -1) {
                // Actualiza el usuario en `this.users` con los nuevos datos de `payload`
                this.users[userIndex] = {
                    ...this.users[userIndex], // Mantenemos las propiedades existentes
                    ...payload // Sobrescribimos solo las propiedades que están en `payload`
                };

                // También puedes actualizar el caché si es necesario
                cache.setItem('users', this.users);
            }
        },
        async updateProfileUser(payload, id) {
            try {
                const data = await updateProfileUser(payload, id);
                cache.setItem('user', data);
                this.user = data;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        },
        async deleteUser(id) {
            try {
                const response = await deleteUser(id);
                if (response.success) {
                    // Eliminar el usuario del estado local
                    this.users = this.users.filter((user) => user.id !== id);
                    // Actualizar el caché con la lista de usuarios actualizada
                    cache.setItem('users', this.users);
                }
                return response;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return { success: false, status: this.status };
            }
        }
    }
});
