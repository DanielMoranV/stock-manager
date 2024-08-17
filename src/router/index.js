import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/dashboard',
            component: AppLayout,
            children: [
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/profile',
                    name: 'profile',
                    component: () => import('@/views/home/Profile.vue')
                },
                {
                    path: '/users',
                    name: 'users',
                    component: () => import('@/views/home/Users.vue')
                },

                {
                    path: '/company',
                    name: 'company',
                    component: () => import('@/views/home/Company.vue')
                },
                {
                    path: '/products',
                    name: 'products',
                    component: () => import('@/views/inventory/Products.vue')
                },
                {
                    path: '/categories',
                    name: 'categories',
                    component: () => import('@/views/inventory/Categories.vue')
                },
                {
                    path: '/units',
                    name: 'units',
                    component: () => import('@/views/inventory/Units.vue')
                }
            ]
        },
        {
            path: '/',
            name: 'login',
            component: () => import('@/views/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/auth/Error.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/NotFound.vue')
        },
        // Ruta catch-all para manejar rutas no definidas
        {
            path: '/:catchAll(.*)',
            redirect: '/pages/notfound'
        }
    ]
});

export default router;
