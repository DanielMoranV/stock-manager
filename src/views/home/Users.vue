<script setup>
import { useRolesStore } from '@/stores/rolesStore';
import { useUsersStore } from '@/stores/usersStore';
import { exportToExcel } from '@/utils/excelUtils';
import { capitalizeName, findIndexById, restrictToNumbers, validateDNI, validateEmail, validatePhone } from '@/utils/validationUtils';
import { FilterMatchMode } from '@primevue/core/api';
import ExcelJS from 'exceljs';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref, watch } from 'vue';

// Estado de carga
const isLoading = ref(false);
const loadingUsers = ref(false);

// Referencias y datos
const userStore = useUsersStore();
const rolesStore = useRolesStore();
const toast = useToast();

const users = ref(null);
const userDialog = ref(false);
const deleteUserDialog = ref(false);
const deleteUsersDialog = ref(false);
const user = ref({});
const selectedUsers = ref(null);
const roles = ref([]);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);

// Estados de validación
const isDNIValid = ref(true);
const isEmailValid = ref(true);
const isPhoneValid = ref(true);

// Inicializar filtros
const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

// Validar campos
const validateFields = () => {
    validateDNIField();
    validateEmailField();
    validatePhoneField();
};

// Verificar si el formulario es válido
const isFormValid = () => {
    return user.value.name && user.value.name.trim() && user.value.email && isDNIValid.value && isEmailValid.value && isPhoneValid.value;
};

// Manejar entrada de nombre
const handleNameInput = () => {
    user.value.name = capitalizeName(user.value.name);
};

// Validar DNI
const validateDNIField = () => {
    isDNIValid.value = validateDNI(user.value.dni);
};

// Validar email
const validateEmailField = () => {
    isEmailValid.value = validateEmail(user.value.email);
};

// Validar teléfono
const validatePhoneField = () => {
    isPhoneValid.value = validatePhone(user.value.phone);
};

// Exportar a Excel
const exportExcel = async () => {
    const columns = [
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Teléfono', key: 'phone', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Rol', key: 'role', width: 15 },
        { header: 'Compañia', key: 'company', width: 15 }
    ];
    const data = users.value.map((user) => ({
        dni: user.dni,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role.name,
        company: user.company.company_name
    }));
    await exportToExcel(columns, data, 'usuarios', 'usuarios');
};

// Abrir diálogo de nuevo usuario
const openNew = () => {
    user.value = {
        role: {
            id: 2
        }
    };
    submitted.value = false;
    userDialog.value = true;
};

// Ocultar diálogo
const hideDialog = () => {
    userDialog.value = false;
    submitted.value = false;
};

// Guardar usuario
const saveUser = async () => {
    submitted.value = true;
    validateFields();

    if (!isFormValid()) {
        return;
    }

    isLoading.value = true;
    loadingUsers.value = true;

    try {
        if (user.value.id) {
            await updateUser();
        } else {
            await createUser();
        }

        userDialog.value = false;
        user.value = {};
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar usuario', life: 3000 });
    } finally {
        isLoading.value = false;
        loadingUsers.value = false;
    }
};

// Actualizar usuario
const updateUser = async () => {
    try {
        // Actualiza el usuario en el store
        await userStore.updateUser(user.value, user.value.id);

        // Encuentra el nombre del rol
        const role = roles.value.find((role) => role.value === user.value.role.id);

        // Verifica si se encontró el rol
        if (!role) {
            throw new Error('Rol no encontrado');
        }

        // Prepara el payload para asignar el rol
        const payload = { dni: user.value.dni, role_name: role.label };
        await rolesStore.assignRole(payload);

        // Actualiza el nombre del rol en el usuario
        user.value.role.name = role.label;

        // Actualiza la lista de usuarios
        const userIndex = findIndexById(user.value.id, users.value);
        if (userIndex !== -1) {
            users.value[userIndex] = { ...user.value };
        } else {
            throw new Error('Usuario no encontrado en la lista');
        }

        // Actualiza el usuario en el store
        userStore.updateListUser(user.value, user.value.id);

        // Muestra un mensaje de éxito
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado', life: 3000 });
    } catch (error) {
        // Maneja cualquier error
        console.error('Error al actualizar el usuario:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
};

// Crear usuario
const createUser = async () => {
    console.log('payload start', user.value);
    // Encuentra el nombre del rol
    const role = roles.value.find((role) => role.value === user.value.role.id);
    user.value.role.name = role.label;
    const response = await userStore.createUser(user.value);

    if (response == 422 || response == 500) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Usuario ya registrado, error en validación', life: 3000 });
        isLoading.value = false;
        loadingUsers.value = false;
        userDialog.value = false;
        user.value = {};
        return;
    }

    user.value = response;

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Nuevo usuario agregado', life: 3000 });
};

// Editar usuario
const editUser = (editUser) => {
    user.value = { ...editUser };
    userDialog.value = true;
};

// Confirmar eliminación de usuario
const confirmDeleteUser = (editUser) => {
    user.value = editUser;
    deleteUserDialog.value = true;
};

// Eliminar usuario
const deleteUser = async () => {
    isLoading.value = true;
    const response = await userStore.deleteUser(user.value.id);
    if (response.success == true) {
        if (response.message == 'Usuario deshabilitado exitosamente') {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario deshabilitado', life: 3000 });
        } else {
            users.value = users.value.filter((val) => val.id !== user.value.id);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario Eliminado', life: 3000 });
        }

        deleteUserDialog.value = false;
        user.value = {};
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al elimar usuario', life: 3000 });
    }
    isLoading.value = false;
};

// Confirmar eliminación de usuarios seleccionados
const confirmDeleteSelected = () => {
    deleteUsersDialog.value = true;
};

// Eliminar usuarios seleccionados
const deleteSelectedUsers = async () => {
    isLoading.value = true;
    if (!selectedUsers.value || selectedUsers.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay usuarios seleccionados', life: 3000 });
        return;
    }

    const selectedUserIds = selectedUsers.value.map((user) => user.id);
    const successfulDeletes = [];
    const failedDeletes = [];

    await Promise.all(
        selectedUserIds.map(async (id) => {
            try {
                const response = await userStore.deleteUser(id);
                if (response.success) {
                    successfulDeletes.push(id);
                } else {
                    failedDeletes.push(id);
                }
            } catch (error) {
                failedDeletes.push(id);
            }
        })
    );

    // Filtrar la lista de usuarios en el frontend
    users.value = users.value.filter((user) => !successfulDeletes.includes(user.id));
    deleteUsersDialog.value = false;
    selectedUsers.value = [];

    if (failedDeletes.length > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: `${failedDeletes.length} usuarios no pudieron ser eliminados`, life: 3000 });
    } else {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuarios eliminados exitosamente', life: 3000 });
    }
    isLoading.value = false;
};

// Ciclos de vida del componente
onBeforeMount(() => {
    initFilters();
});

onMounted(async () => {
    try {
        loadingUsers.value = true;

        // Carga usuarios si no están en la tienda
        users.value = userStore.getUsers || (await userStore.fetchUsers());

        // Carga roles si no están en la tienda
        roles.value = rolesStore.getRolesComboBox || (await rolesStore.fetchRolesComboBox());
    } catch (error) {
        console.error('Error al cargar los datos:', error);
    } finally {
        loadingUsers.value = false;
    }
});
// Importar Datos Excel
const onUpload = async (event) => {
    const file = event.files[0];

    if (!file) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se seleccionó ningún archivo', life: 3000 });
        return;
    }

    if (!file.name.endsWith('.xlsx')) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Formato de archivo no válido', life: 3000 });
        return;
    }

    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.load(file);
        const worksheet = workbook.worksheets[0];
        const rows = worksheet.getSheetValues();

        // Verificar si hay datos suficientes en el archivo
        if (rows.length < 3) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'El archivo no contiene suficientes datos', life: 3000 });
            return;
        }

        // Procesar los datos del archivo
        const usersData = rows.slice(2).map((row) => ({
            dni: row[1],
            name: row[2],
            phone: row[3],
            email: row[4],
            role: row[5]
        }));

        // Validar datos procesados antes de enviarlos
        if (usersData.some((user) => !user.dni || !user.name || !user.email || !user.role)) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'El archivo contiene datos incompletos', life: 3000 });
            return;
        }

        // Enviar los datos a la base de datos
        await uploadUsers(usersData);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el archivo', life: 3000 });
    }
};

const uploadUsers = async (usersData) => {
    loadingUsers.value = true;
    try {
        // Enviar los datos al backend
        const response = await userStore.uploadUsers(usersData);

        // Actualizar la lista de usuarios después de la carga
        users.value = await userStore.fetchUsers();

        // Manejar notificaciones para éxito y errores
        if (response.success.length > 0) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `${response.success.length} datos importados correctamente`,
                life: 3000
            });
        }

        if (response.errors.length > 0) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: `${response.errors.length} datos no pudieron ser importados`,
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al importar los datos',
            life: 3000
        });
    } finally {
        loadingUsers.value = false;
    }
};

// Watchers
watch(() => user.value.dni, validateDNIField);
watch(() => user.value.email, validateEmailField);
watch(() => user.value.phone, validatePhoneField);
</script>

<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedUsers || !selectedUsers.length" :loading="isLoading" />
            </template>

            <template #end>
                <FileUpload mode="basic" accept=".xlsx" :maxFileSize="1000000" label="Importar" chooseLabel="Carga masiva" class="mr-2 inline-block" :auto="true" @select="onUpload($event)" />
                <Button label="Exportar Excel" icon="pi pi-file-excel" severity="info" @click="exportExcel" />
            </template>
        </Toolbar>

        <DataTable
            ref="dt"
            :value="users"
            v-model:selection="selectedUsers"
            dataKey="id"
            :paginator="true"
            :loading="loadingUsers"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Mostrando del {first} al {last} de {totalRecords} usuarios"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Gestión de Usuarios</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Buscar..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="dni" header="DNI" :sortable="true" headerStyle="width:10%; min-width:8rem;"> </Column>
            <Column field="name" header="Nombre" :sortable="true" headerStyle="width:25%; min-width:10rem;"> </Column>
            <Column field="phone" header="Teléfono" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="email" header="Email" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="role.name" header="Rol" :sortable="true" headerStyle="width:14%; min-width:8rem;">
                <template #body="slotProps">
                    {{ slotProps.data.role.name.toUpperCase() }}
                </template>
            </Column>
            <Column field="is_active" header="Estado" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    <ToggleSwitch v-model="slotProps.data.is_active" />
                </template>
            </Column>
            <Column field="company.company_name" header="Compañia" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                <template #body="slotProps">
                    {{ slotProps.data.company.company_name.toUpperCase() }}
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded @click="editUser(slotProps.data)" />
                    <Button icon="pi pi-trash" class="mt-2" severity="warn" rounded @click="confirmDeleteUser(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="userDialog" :style="{ width: '450px' }" header="Detalle de Usuario" :modal="true">
            <div class="mb-3">
                <label for="name" class="block font-bold mb-1">Nombre</label>
                <InputText id="name" v-model.trim="user.name" @input="handleNameInput" required autofocus :invalid="submitted && !user.name" fluid />
                <small class="text-red-500" v-if="submitted && !user.name">Nombre es requerido.</small>
            </div>
            <div class="mb-3">
                <label for="dni" class="block font-bold mb-1">DNI</label>
                <InputText id="dni" v-model.trim="user.dni" @input="validateDNIField" @keypress="restrictToNumbers" required autofocus :invalid="submitted && !isDNIValid" maxlength="8" fluid />
                <small class="text-red-500" v-if="submitted && !isDNIValid">DNI es inválido o requerido.</small>
            </div>
            <div class="mb-3">
                <label for="email" class="block font-bold mb-1">Correo Electrónico</label>
                <InputText id="email" v-model.trim="user.email" @input="validateEmailField" required autofocus :invalid="submitted && !isEmailValid" fluid />
                <small class="text-red-500" v-if="submitted && !isEmailValid">Correo electrónico es inválido o requerido.</small>
            </div>
            <div class="mb-3">
                <label for="phone" class="block font-bold mb-1">Teléfono</label>
                <InputText id="phone" v-model.trim="user.phone" @input="validatePhoneField" @keypress="restrictToNumbers" required autofocus :invalid="submitted && !isPhoneValid" maxlength="9" fluid />
                <small class="text-red-500" v-if="submitted && !isPhoneValid">Teléfono es inválido o requerido.</small>
            </div>
            <div class="mb-3">
                <label for="rol" class="block font-bold mb-1">Roles</label>
                <Select id="rol" v-model="user.role.id" :options="roles" optionValue="value" optionLabel="label" placeholder="Selecciona Rol" fluid></Select>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" text :loading="isLoading" @click="saveUser" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteUserDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="user"
                    >Estás seguro de que quieres eliminar <b>{{ user.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteUserDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="deleteUser" :loading="isLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteUsersDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="users">¿Está seguro de que desea eliminar los usuarios seleccionados</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteUsersDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="deleteSelectedUsers" :loading="isLoading" />
            </template>
        </Dialog>
    </div>
</template>
