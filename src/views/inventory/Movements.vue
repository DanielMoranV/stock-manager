<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useStockMomentsStore } from '@/stores/stockMovementsStore';
import { dformat } from '@/utils/day';
import { formatCurrency } from '@/utils/validationUtils';
import { FilterMatchMode } from '@primevue/core/api';
import DataTable from 'primevue/datatable';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';

const isLoading = ref(false);

const stockMovementsStore = useStockMomentsStore();
const authStore = useAuthStore();

const toast = useToast();

const stockMovements = ref([]);
const stockMovement = ref([]);
const filters = ref({});
const submitted = ref(false);
const entryStockMovementDialog = ref(false);
const expandedRows = ref({});
const selectedStockMovements = ref(null);

const expandAll = () => {
    expandedRows.value = stockMovements.value.reduce((acc, p) => (acc[p.id] = true) && acc, {});
};
const collapseAll = () => {
    expandedRows.value = null;
};

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};
const openNewEntry = () => {
    stockMovement.value = {};
    submitted.value = false;
    entryStockMovementDialog.value = true;
};
const entryData = ref({
    serie: '',
    numero: '',
    monto: '',
    estado: null,
    fechaEmision: null,
    comentario: '',
    proveedor: null
});

// Opciones para el combobox de estado
const estadoOptions = ref([
    { label: 'Pagado', value: 'pagado' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Crédito', value: 'credito' }
]);

// Opciones para el combobox de proveedor
const proveedores = ref([
    { label: 'Danitec', value: 'danitec' },
    { label: 'Compucenter', value: 'compucenter' },
    { label: 'PCStore', value: 'pcstore' }
]);

const hideDialog = () => {
    entryStockMovementDialog.value = false;
    submitted.value = false;
};

onBeforeMount(() => {
    initFilters();
});

onMounted(async () => {
    stockMovements.value = stockMovementsStore.getStockMovements || (await stockMovementsStore.fetchStockMoments());
});
</script>
<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Ingreso" icon="pi pi-plus" severity="success" class="mr-2" @click="openNewEntry" />
                <Button label="Salida" icon="pi pi-minus" severity="danger" class="mr-2" @click="openNewEntry" />
                <!-- <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" :loading="isLoading" /> -->
            </template>

            <!-- <template #end>
                <FileUpload mode="basic" accept=".xlsx" :maxFileSize="1000000" label="Importar" chooseLabel="Carga masiva" class="mr-2 inline-block" :auto="true" @select="onUpload($event)" />
                <Button label="Exportar Excel" icon="pi pi-file-excel" severity="info" @click="exportExcel" />
            </template> -->
        </Toolbar>
        <DataTable
            ref="dt"
            :value="stockMovements"
            v-model:expandedRows="expandedRows"
            dataKey="id"
            :paginator="true"
            :loading="stockMovementsStore.isLoading"
            :rows="30"
            :filters="filters"
            stripedRows
            selectionMode="single"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25, 50, 100]"
            currentPageReportTemplate="Mostrando del {first} al {last} de {totalRecords} movimientos"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Gestión de Movimientos de Stock</h4>

                    <div class="flex flex-wrap justify-end gap-2">
                        <Button text icon="pi pi-plus" label="Mostrar Todo" @click="expandAll" />
                        <Button text icon="pi pi-minus" label="Ocultar todo" @click="collapseAll" />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Buscar..." />
                        </IconField>
                    </div>
                </div>
            </template>
            <Column expander style="width: 2rem" />
            <Column field="id" header="N°" :sortable="true" headerStyle="width:5%; min-width:3rem;"> </Column>
            <Column field="user.name" header="Usuario" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="category_movement.type" header="Tipo" :sortable="true" headerStyle="width:10%; min-width:5rem;">
                <template #body="slotProps">
                    <span
                        :class="{
                            'bg-green-100 text-green-800 text-sm px-2 py-1 rounded font-bold': slotProps.data.category_movement.type.toUpperCase() === 'ENTRADA',
                            'bg-red-100 text-red-800 text-sm px-2 py-1 rounded font-bold': slotProps.data.category_movement.type.toUpperCase() === 'SALIDA'
                        }"
                    >
                        {{ slotProps.data.category_movement.type.toUpperCase() }}
                    </span>
                </template>
            </Column>
            <Column field="category_movement.name" header="Categoría" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="voucher.concat" header="Comprobante" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="voucher.amount" header="Total" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.voucher.amount) }}
                </template>
            </Column>
            <Column field="provider.name" header="Proveedor" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <Column field="created_at" header="Fecha" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    {{ dformat(slotProps.data.created_at, 'DD-MM-YY hh:mm a') }}
                </template>
            </Column>
            <Column field="comment" header="Comentario" :sortable="true" headerStyle="width:20%; min-width:10rem;"> </Column>
            <template #expansion="slotProps">
                <div class="p-4">
                    <h5>Detalle de movimiento N° {{ slotProps.data.id }}</h5>
                    <DataTable :value="slotProps.data.movements_details">
                        <Column field="product_batch.product.name" header="Producto" sortable></Column>
                        <Column field="product_batch.batch_number" header="N° Lote" sortable></Column>

                        <Column field="product_batch.price" header="Precio Unitario" sortable>
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.product_batch.price) }}
                            </template>
                        </Column>
                        <Column field="count" header="Cantidad" sortable></Column>
                        <Column field="sub_total" header="Total" sortable>
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.sub_total) }}
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </template>
        </DataTable>
        <Dialog v-model:visible="entryStockMovementDialog" header="Nuevo Movimiento Entrada" :modal="true">
            <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Serie -->
                <div class="field">
                    <label for="serie" class="block mb-1 text-sm font-medium text-gray-700">Serie</label>
                    <InputText id="serie" v-model="entryData.serie" required class="w-full border border-gray-300 rounded-md p-2" />
                </div>

                <!-- Número -->
                <div class="field">
                    <label for="numero" class="block mb-1 text-sm font-medium text-gray-700">Número</label>
                    <InputText id="numero" v-model="entryData.numero" required class="w-full border border-gray-300 rounded-md p-2" />
                </div>

                <!-- Monto -->
                <div class="field">
                    <label for="monto" class="block mb-1 text-sm font-medium text-gray-700">Monto</label>
                    <InputText id="monto" v-model="entryData.monto" type="number" required class="w-full border border-gray-300 rounded-md p-2" />
                </div>

                <!-- Estado -->
                <div class="field">
                    <label for="estado" class="block mb-1 text-sm font-medium text-gray-700">Estado</label>
                    <Dropdown id="estado" v-model="entryData.estado" :options="estadoOptions" optionLabel="label" placeholder="Seleccione el estado" required class="w-full" />
                </div>

                <!-- Fecha Emisión -->
                <div class="field">
                    <label for="fechaEmision" class="block mb-1 text-sm font-medium text-gray-700">Fecha Emisión</label>
                    <Calendar id="fechaEmision" v-model="entryData.fechaEmision" showIcon class="w-full" />
                </div>

                <!-- Proveedor -->
                <div class="field">
                    <label for="proveedor" class="block mb-1 text-sm font-medium text-gray-700">Proveedor</label>
                    <Dropdown id="proveedor" v-model="entryData.proveedor" :options="proveedores" placeholder="Seleccione un proveedor" required class="w-full" />
                </div>

                <!-- Comentario (Textarea) -->
                <div class="field md:col-span-2">
                    <label for="comentario" class="block mb-1 text-sm font-medium text-gray-700">Comentario</label>
                    <Textarea id="comentario" v-model="entryData.comentario" rows="3" class="w-full border border-gray-300 rounded-md p-2" />
                </div>

                <!-- Productos -->
                <div class="field md:col-span-2">
                    <label class="block mb-1 text-sm font-medium text-gray-700">Productos</label>
                    <div class="flex items-center space-x-2 mb-2">
                        <Button label="Agregar Producto" icon="pi pi-plus" class="p-button-success" @click="addProduct" />
                        <Button label="Eliminar Producto" icon="pi pi-trash" class="p-button-danger" @click="removeSelectedProduct" :disabled="!selectedProduct" />
                    </div>
                    <DataList :value="productos" v-model:selection="selectedProduct" dataKey="id" selectionMode="single" class="mt-2">
                        <template #item="slotProps">
                            <div class="flex justify-between items-center p-2 border rounded-md">
                                <span>{{ slotProps.data.name }}</span>
                                <span class="text-sm text-gray-500">{{ slotProps.data.price | currency }}</span>
                            </div>
                        </template>
                    </DataList>
                </div>
            </div>

            <!-- Footer -->
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" text :loading="isLoading" @click="saveEntryMovementStock" />
            </template>
        </Dialog>
    </div>
</template>
