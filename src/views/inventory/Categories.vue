<script setup>
import { useProductsStore } from '@/stores/products';
import { exportToExcel } from '@/utils/excelUtils';
import { capitalizeName, findIndexById } from '@/utils/validationUtils';
import { FilterMatchMode } from '@primevue/core/api';
import ExcelJS from 'exceljs';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';
//import { handleApiResponse } from '@/utils/response';

// Estado de carga
const isLoading = ref(false);
const loadingCategories = ref(false);

// Stores
const productsStore = useProductsStore();

const categories = ref(null);
const category = ref(null);
const deleteCategoriesDialog = ref(false);
const deleteCategoryDialog = ref(false);
const userId = ref(null);
const units = ref(null);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const categoryDialog = ref(false);
const selectedCategories = ref(null);

// Toast y Router
const toast = useToast();

const isFormValid = () => {
    return category.value.name && category.value.name.trim() && category.value.code && category.value.code.trim();
};
// Manejar entrada de nombre
const handleNameInput = () => {
    category.value.name = capitalizeName(category.value.name);
};

// Inicializar filtros
const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

// Exportar a Excel
const exportExcel = async () => {
    const columns = [
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Descripción', key: 'description', width: 30 }
    ];
    const data = categories.value.map((category) => ({
        name: category.name,
        description: category.description
    }));
    await exportToExcel(columns, data, 'categorias', 'categorias');
};

// Abrir diálogo de nuevo usuario
const openNew = () => {
    category.value = {};
    submitted.value = false;
    categoryDialog.value = true;
};

// Ocultar diálogo
const hideDialog = () => {
    categoryDialog.value = false;
    submitted.value = false;
};

// Guardar usuario
const saveCategory = async () => {
    submitted.value = true;

    if (!isFormValid()) {
        return;
    }

    isLoading.value = true;
    loadingCategories.value = true;

    try {
        const categoryIndex = categories.value.findIndex((item) => item.value === category.value.category.id);
        const unitIndex = units.value.findIndex((item) => item.value === category.value.unit.id);
        category.value.category.name = categories.value[categoryIndex].label;
        category.value.unit.name = units.value[unitIndex].label;
        if (category.value.id) {
            await updateCategory();
        } else {
            await createCategory();
        }

        categoryDialog.value = false;
        category.value = {};
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar usuario', life: 3000 });
    } finally {
        isLoading.value = false;
        loadingCategories.value = false;
    }
};

// Actualizar producto
const updateCategory = async () => {
    await productsStore.updateCategory(category.value, category.value.id);
    const categoryIndex = findIndexById(category.value.id, categories.value);

    categories.value[categoryIndex] = category.value;
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Categorias actualizado', life: 3000 });
};

// Crear producto
const createCategory = async () => {
    category.value.user_id = userId.value;
    const response = await productsStore.createCategory(category.value);

    if (response == '422') {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Categoria ya registrado, error en validación', life: 3000 });
        isLoading.value = false;
        loadingCategories.value = false;
        categoryDialog.value = false;
        category.value = {};
        return;
    }

    category.value = response;
    categories.value.push(category.value);

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Nuevo usuario agregado', life: 3000 });
};

// Ciclos de vida del componente
onBeforeMount(() => {
    initFilters();
});

onMounted(async () => {
    loadingCategories.value = true;
    await productsStore.getCategories().then((data) => (categories.value = data));
    loadingCategories.value = false;
});

// Editar producto
const editCategory = (editCategory) => {
    category.value = { ...editCategory };
    categoryDialog.value = true;
};

// Importar Datos Excel
const onUpload = async (event) => {
    const file = event.files[0];
    if (file && file.name.endsWith('.xlsx')) {
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.load(file);
            const worksheet = workbook.worksheets[0];
            const rows = worksheet.getSheetValues();

            // Procesar los datos del archivo
            const categoriesData = rows.slice(2).map((row) => ({
                code: row[1],
                name: row[2],
                description: row[3] ? row[3] : null,
                category_id: categories.value.find((category) => category.label === row[4])?.value || null,
                unit_id: units.value.find((unit) => unit.label === row[5].toUpperCase())?.value || null,
                user_id: userId.value
            }));
            await uploadCategories(categoriesData);
        } catch (error) {
            console.error('Error al procesar el archivo', error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el archivo', life: 3000 });
        }
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Formato de archivo no válido', life: 3000 });
    }
};

const uploadCategories = async (categoriesData) => {
    loadingCategories.value = true;
    try {
        // Enviar los datos al backend
        const response = await productsStore.uploadCategories(categoriesData);
        await productsStore.getCategories().then((data) => (categories.value = data));
        if (response.success.length != 0) {
            response.success.length;
            toast.add({ severity: 'success', summary: 'Éxito', detail: response.success.length + ' Datos importados correctamente', life: 3000 });
        }
        if (response.errors.length != 0) {
            response.success.length;
            toast.add({ severity: 'error', summary: 'Éxito', detail: response.errors.length + ' Datos importados incorrectamente', life: 3000 });
        }
        //users.value.push(...response.success);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al importar los datos', life: 3000 });
    } finally {
        loadingCategories.value = false;
    }
};

// Confirmar eliminación de usuario
const confirmDeleteCategory = (categoryDeleted) => {
    category.value = categoryDeleted;
    deleteCategoryDialog.value = true;
};

// Eliminar producto
const deleteCategory = async () => {
    const response = await productsStore.deleteCategory(category.value.id);
    if (response == true) {
        categories.value = categories.value.filter((val) => val.id !== category.value.id);
        deleteCategoryDialog.value = false;
        category.value = {};
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Categoria Eliminado', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al elimar Categoria', life: 3000 });
    }
};

// Confirmar eliminacion
const confirmDeleteSelected = () => {
    deleteCategoriesDialog.value = true;
};
// Eliminar Categoria
const deleteSelectedCategories = async () => {
    const selectedCategoriesIds = selectedCategories.value.map((category) => category.id);
    const successfulDeletes = [];
    const failedDeletes = [];

    for (const id of selectedCategoriesIds) {
        try {
            const response = await productsStore.deleteCategory(id);
            if (response) {
                successfulDeletes.push(id);
            } else {
                failedDeletes.push(id);
            }
        } catch (error) {
            failedDeletes.push(id);
        }
    }

    // Filtrar la lista de usuarios en el frontend
    categories.value = categories.value.filter((val) => !successfulDeletes.includes(val.id));
    deleteCategoriesDialog.value = false;
    selectedCategories.value = null;

    if (failedDeletes.length > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: failedDeletes.length + ' productos no pudieron ser eliminados', life: 3000 });
    } else {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Categorias Eliminados', life: 3000 });
    }
};
</script>
<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedCategories || !selectedCategories.length" />
            </template>

            <template #end>
                <FileUpload mode="basic" accept=".xlsx" :maxFileSize="1000000" label="Importar" chooseLabel="Carga masiva" class="mr-2 inline-block" :auto="true" @select="onUpload($event)" />
                <Button label="Exportar Excel" icon="pi pi-file-excel" severity="info" @click="exportExcel" />
            </template>
        </Toolbar>
        <DataTable
            ref="dt"
            :value="categories"
            v-model:selection="selectedCategories"
            dataKey="id"
            :paginator="true"
            :loading="loadingCategories"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25, 50, 100]"
            currentPageReportTemplate="Mostrando del {first} al {last} de {totalRecords} productos"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Gestión de Categorias</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Buscar..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="Id" :sortable="true" headerStyle="width:10%; min-width:8rem;"> </Column>
            <Column field="name" header="Nombre" :sortable="true" headerStyle="width:25%; min-width:10rem;"> </Column>
            <Column field="description" header="Descripción" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>

            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded @click="editCategory(slotProps.data)" />
                    <Button icon="pi pi-trash" class="mt-2" severity="warn" rounded @click="confirmDeleteCategory(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="categoryDialog" :style="{ width: '450px' }" header="Detalle de Usuario" :modal="true">
            <div class="mb-3">
                <label for="name" class="block font-bold mb-1">Nombre</label>
                <InputText id="name" v-model.trim="category.name" @input="handleNameInput" required autofocus :invalid="submitted && !category.name" fluid />
                <small class="text-red-500" v-if="submitted && !category.name">Nombre es requerido.</small>
            </div>
            <div class="mb-3">
                <label for="description" class="block font-bold mb-1">Descripción</label>
                <Textarea rows="2" id="description" v-model.trim="category.description" required autofocus fluid />
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" text :loading="isLoading" @click="saveCategory" />
            </template>
        </Dialog>
        <Dialog v-model:visible="deleteCategoryDialog" :style="{ width: '450px' }" header="Confirmar Eliminación" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="category"
                    >Estás seguro de que quieres eliminar <b>{{ category.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteCategoryDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="deleteCategory" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCategoriesDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="categories">¿Está seguro de que desea eliminar los productos seleccionados</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteCategoriesDialog = false" />
                <Button label="Sí" icon="pi pi-check" text @click="deleteSelectedCategories" />
            </template>
        </Dialog>
    </div>
</template>
