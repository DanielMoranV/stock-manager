<script setup>
import AppConfig from '@/layout/AppConfig.vue';
import { useLayout } from '@/layout/composables/layout';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';

const { layoutConfig } = useLayout();
const authStore = useAuthStore();

const router = useRouter();
const toast = useToast();
const isLoading = ref(false);

const dataUser = reactive({
    dni: '',
    password: ''
});

//const checked = ref(false);

const logoUrl = computed(() => {
    return `/layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});

const login = async () => {
    isLoading.value = true;
    // Verificar si el correo electrónico y la contraseña son campos requeridos
    if (!dataUser.dni || !dataUser.password) {
        return toast.add({ severity: 'warn', summary: 'Por favor complete los campos requeridos', life: 3000 });
    }

    // Verificar si los campos contienen espacios en blanco
    if (/\s/.test(dataUser.dni) || /\s/.test(dataUser.password)) {
        return toast.add({ severity: 'warn', summary: 'Los campos no pueden contener espacios en blanco', life: 3000 });
    }
    // Verificar si la contraseña tiene al menos 6 caracteres
    if (dataUser.password.length < 6) {
        return toast.add({ severity: 'warn', summary: 'La contraseña debe tener al menos 6 caracteres', life: 3000 });
    }
    await authStore.login(dataUser);
    if (authStore.session) {
        // Mostrar el toast
        toast.add({ severity: 'success', summary: 'Validación Correcta Bienvenido', life: 3000 });

        setTimeout(() => router.push('/dashboard'), 2000);
    } else {
        switch (authStore.msg) {
            case 'Unauthorized':
                toast.add({ severity: 'warn', summary: 'Credenciales incorrectas', life: 3000 });
                break;
            default:
                console.log(authStore.msg);
                toast.add({ severity: 'error', summary: 'Ocurrió un error en el servidor intentelo más tarde.', life: 3000 });
                break;
        }
    }
    isLoading.value = authStore.session;
};
</script>

<template>
    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
                    <div class="text-center">
                        <img :src="logoUrl" alt="Sakai logo" class="w-6rem flex-shrink-0" />
                        <div class="text-900 text-3xl font-medium mb-3">Bienvenido</div>
                        <span class="text-600 font-medium">Inicie Sesión para continuar</span>
                    </div>

                    <div>
                        <label for="dni" class="block text-900 text-xl font-medium mb-2">DNI</label>
                        <InputText id="dni" type="text" placeholder="DNI" class="w-full md:w-30rem mb-5" style="padding: 1rem" v-model="dataUser.dni" />

                        <label for="password" class="block text-900 font-medium text-xl mb-2">Contraseña</label>
                        <Password id="password" v-model="dataUser.password" placeholder="Contraseña" :toggleMask="true" class="w-full mb-3" inputClass="w-full" :inputStyle="{ padding: '1rem' }"></Password>

                        <!-- <div class="flex align-items-center justify-content-between mb-5 gap-5">
                            <div class="flex align-items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Recuerdame</label>
                            </div>
                            <a class="font-medium no-underline ml-2 text-right cursor-pointer" style="color: var(--primary-color)">Olvidó su contraseña?</a>
                        </div> -->
                        <Toast />
                        <!-- Mostrar el botón solo si isLoading es false -->
                        <Button v-if="!isLoading" label="Iniciar Sesión" class="w-full p-3 text-xl" @click="login"></Button>

                        <!-- Mostrar el spinner solo si isLoading es true -->
                        <div v-else class="flex justify-content-center mt-3">
                            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" aria-label="Custom ProgressSpinner" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <AppConfig simple />
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
