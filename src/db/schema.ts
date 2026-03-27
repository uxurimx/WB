import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  real,
  boolean,
  serial,
  date,
  time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// USERS — sincronizados desde Clerk via webhook
// ─────────────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("despachador"),
  // roles: admin | gerente | despachador | operador_nissan | encargado_obra | chofer
  phone: varchar("phone", { length: 20 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// OPERADORES — choferes y maquinistas (no son usuarios del sistema)
// ─────────────────────────────────────────────────────────────────────────────
export const operadores = pgTable("operadores", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull().default("chofer"),
  // tipos: chofer | maquinista | taller
  telefono: varchar("telefono", { length: 20 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIDADES — camiones, maquinaria, nissan y otros vehículos
// ─────────────────────────────────────────────────────────────────────────────
export const unidades = pgTable("unidades", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(),
  // ejemplos: CA12, EX01, NISSAN, R02, MINI02
  nombre: text("nombre"),
  tipo: varchar("tipo", { length: 20 }).notNull(),
  // tipos: camion | maquina | nissan | otro
  modelo: text("modelo"),
  operadorDefaultId: integer("operador_default_id"),
  capacidadTanque: real("capacidad_tanque"),         // litros
  odometroActual: real("odometro_actual").default(0), // km o horas según tipo
  rendimientoReferencia: real("rendimiento_referencia"), // km/L o L/Hr
  activo: boolean("activo").notNull().default(true),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// OBRAS — proyectos activos
// ─────────────────────────────────────────────────────────────────────────────
export const obras = pgTable("obras", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  cliente: text("cliente"),
  activo: boolean("activo").notNull().default(true),
  fechaInicio: date("fecha_inicio"),
  fechaFin: date("fecha_fin"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// FUENTES DE DIESEL — origen del combustible
// ─────────────────────────────────────────────────────────────────────────────
export const fuentesDiesel = pgTable("fuentes_diesel", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull(),
  // tipos: taller | nissan | externo (amigo, oxxogas, etc.)
  descripcion: text("descripcion"),
  activo: boolean("activo").notNull().default(true),
});

// ─────────────────────────────────────────────────────────────────────────────
// TANQUES — inventario físico de diesel disponible
// ─────────────────────────────────────────────────────────────────────────────
export const tanques = pgTable("tanques", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(), // "Taller" | "NISSAN"
  capacidadMax: real("capacidad_max").notNull(), // litros
  litrosActuales: real("litros_actuales").notNull().default(0),
  cuentalitrosActual: real("cuentalitros_actual").default(0),
  ajustePorcentaje: real("ajuste_porcentaje").default(2), // % merma (default 2%)
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PERIODOS — semanas de trabajo (sábado → viernes)
// ─────────────────────────────────────────────────────────────────────────────
export const periodos = pgTable("periodos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(), // "14 al 20 de Marzo 2026"
  fechaInicio: date("fecha_inicio").notNull(),
  fechaFin: date("fecha_fin").notNull(),
  cerrado: boolean("cerrado").notNull().default(false),
  cerradoPorId: text("cerrado_por_id"),
  cerradoAt: timestamp("cerrado_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CARGAS — evento principal: cada despacho de diesel
// ─────────────────────────────────────────────────────────────────────────────
export const cargas = pgTable("cargas", {
  id: serial("id").primaryKey(),
  fecha: date("fecha").notNull(),
  hora: time("hora"),
  folio: integer("folio"),
  periodoId: integer("periodo_id"),
  unidadId: integer("unidad_id").notNull(),
  operadorId: integer("operador_id"),
  obraId: integer("obra_id"),
  fuenteId: integer("fuente_id"),
  tanqueId: integer("tanque_id"),
  litros: real("litros").notNull(),
  odometroHrs: real("odometro_hrs"),         // km acumulados o hrs máquina
  cuentaLtInicio: real("cuenta_lt_inicio"),  // lectura cuentalitros antes
  cuentaLtFin: real("cuenta_lt_fin"),        // lectura cuentalitros después
  origen: varchar("origen", { length: 10 }).notNull().default("patio"),
  // origen: patio | campo
  tipoDiesel: varchar("tipo_diesel", { length: 20 }).default("normal"),
  // tipo: normal | amigo | oxxogas
  notas: text("notas"),
  registradoPorId: text("registrado_por_id"), // Clerk user ID
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RECARGAS DE TANQUE — cuando llega diesel al taller
// ─────────────────────────────────────────────────────────────────────────────
export const recargasTanque = pgTable("recargas_tanque", {
  id: serial("id").primaryKey(),
  fecha: date("fecha").notNull(),
  litros: real("litros").notNull(),
  proveedor: text("proveedor"),
  folioFactura: text("folio_factura"),
  precioLitro: real("precio_litro"),
  tanqueId: integer("tanque_id").notNull(),
  registradoPorId: text("registrado_por_id"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RENDIMIENTOS — calculados al cerrar cada periodo
// ─────────────────────────────────────────────────────────────────────────────
export const rendimientos = pgTable("rendimientos", {
  id: serial("id").primaryKey(),
  periodoId: integer("periodo_id").notNull(),
  unidadId: integer("unidad_id").notNull(),
  operadorId: integer("operador_id"),
  odometroInicial: real("odometro_inicial"),
  odometroFinal: real("odometro_final"),
  kmHrsRecorridos: real("km_hrs_recorridos"),
  litrosConsumidos: real("litros_consumidos").notNull(),
  rendimientoActual: real("rendimiento_actual"),      // km/L o L/Hr
  rendimientoReferencia: real("rendimiento_referencia"),
  diferencia: real("diferencia"),
  dentroDeTolerancia: boolean("dentro_tolerancia"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVOS — fotos de notas y documentos via UploadThing
// ─────────────────────────────────────────────────────────────────────────────
export const archivos = pgTable("archivos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  key: text("key").notNull().unique(),
  nombre: text("nombre"),
  tipo: varchar("tipo", { length: 50 }), // notaFoto | importExcel
  cargaId: integer("carga_id"),          // nullable: foto asociada a una carga
  subidoPorId: text("subido_por_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG — registro de acciones del sistema
// ─────────────────────────────────────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  usuarioId: text("usuario_id"),
  accion: varchar("accion", { length: 50 }).notNull(),
  // acciones: create | update | delete | close_periodo | invite_user
  entidad: varchar("entidad", { length: 50 }).notNull(),
  entidadId: text("entidad_id"),
  datosJson: text("datos_json"), // snapshot JSON del cambio
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS — para queries con joins (drizzle relational API)
// ─────────────────────────────────────────────────────────────────────────────
export const unidadesRelations = relations(unidades, ({ one, many }) => ({
  operadorDefault: one(operadores, {
    fields: [unidades.operadorDefaultId],
    references: [operadores.id],
  }),
  cargas: many(cargas),
  rendimientos: many(rendimientos),
}));

export const operadoresRelations = relations(operadores, ({ many }) => ({
  cargas: many(cargas),
  rendimientos: many(rendimientos),
}));

export const obrasRelations = relations(obras, ({ many }) => ({
  cargas: many(cargas),
}));

export const periodosRelations = relations(periodos, ({ many }) => ({
  cargas: many(cargas),
  rendimientos: many(rendimientos),
}));

export const cargasRelations = relations(cargas, ({ one, many }) => ({
  unidad: one(unidades, {
    fields: [cargas.unidadId],
    references: [unidades.id],
  }),
  operador: one(operadores, {
    fields: [cargas.operadorId],
    references: [operadores.id],
  }),
  obra: one(obras, {
    fields: [cargas.obraId],
    references: [obras.id],
  }),
  periodo: one(periodos, {
    fields: [cargas.periodoId],
    references: [periodos.id],
  }),
  archivos: many(archivos),
}));

export const archivosRelations = relations(archivos, ({ one }) => ({
  carga: one(cargas, {
    fields: [archivos.cargaId],
    references: [cargas.id],
  }),
}));

export const rendimientosRelations = relations(rendimientos, ({ one }) => ({
  periodo: one(periodos, {
    fields: [rendimientos.periodoId],
    references: [periodos.id],
  }),
  unidad: one(unidades, {
    fields: [rendimientos.unidadId],
    references: [unidades.id],
  }),
  operador: one(operadores, {
    fields: [rendimientos.operadorId],
    references: [operadores.id],
  }),
}));

export const recargasTanqueRelations = relations(recargasTanque, ({ one }) => ({
  tanque: one(tanques, {
    fields: [recargasTanque.tanqueId],
    references: [tanques.id],
  }),
}));
