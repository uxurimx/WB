--
-- PostgreSQL database dump
--

\restrict DOahy3zQSuMKR8MMxwdH6al4RwSOg3i0wdBY1LldQ3oCpHbIOafVfzqqXQI6swL

-- Dumped from database version 17.10 (986efc8)
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.analytics_events (
    id integer NOT NULL,
    session_id text NOT NULL,
    type character varying(30) NOT NULL,
    element text,
    x_pct real,
    y_pct real,
    value text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.analytics_events OWNER TO neondb_owner;

--
-- Name: analytics_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.analytics_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_events_id_seq OWNER TO neondb_owner;

--
-- Name: analytics_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.analytics_events_id_seq OWNED BY public.analytics_events.id;


--
-- Name: analytics_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.analytics_sessions (
    id integer NOT NULL,
    session_id text NOT NULL,
    device_type character varying(20),
    browser character varying(30),
    os character varying(30),
    screen_w integer,
    screen_h integer,
    referrer text,
    ip_hash text,
    duration_seconds integer,
    max_scroll_pct integer DEFAULT 0,
    bounced boolean DEFAULT true,
    ended_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.analytics_sessions OWNER TO neondb_owner;

--
-- Name: analytics_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.analytics_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_sessions_id_seq OWNER TO neondb_owner;

--
-- Name: analytics_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.analytics_sessions_id_seq OWNED BY public.analytics_sessions.id;


--
-- Name: archivos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.archivos (
    id integer NOT NULL,
    url text NOT NULL,
    key text NOT NULL,
    nombre text,
    tipo character varying(50),
    carga_id integer,
    subido_por_id text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.archivos OWNER TO neondb_owner;

--
-- Name: archivos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.archivos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.archivos_id_seq OWNER TO neondb_owner;

--
-- Name: archivos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.archivos_id_seq OWNED BY public.archivos.id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    usuario_id text,
    accion character varying(50) NOT NULL,
    entidad character varying(50) NOT NULL,
    entidad_id text,
    datos_json text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_log OWNER TO neondb_owner;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO neondb_owner;

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: cargas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cargas (
    id integer NOT NULL,
    fecha date NOT NULL,
    hora time without time zone,
    folio integer,
    periodo_id integer,
    unidad_id integer NOT NULL,
    operador_id integer,
    obra_id integer,
    fuente_id integer,
    tanque_id integer,
    litros real NOT NULL,
    odometro_hrs real,
    cuenta_lt_inicio real,
    cuenta_lt_fin real,
    origen character varying(10) DEFAULT 'patio'::character varying NOT NULL,
    tipo_diesel character varying(20) DEFAULT 'normal'::character varying,
    notas text,
    registrado_por_id text,
    created_at timestamp without time zone DEFAULT now(),
    quien_suministra_id integer,
    quien_recibe_id integer,
    km_estimado boolean DEFAULT false NOT NULL
);


ALTER TABLE public.cargas OWNER TO neondb_owner;

--
-- Name: cargas_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cargas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cargas_id_seq OWNER TO neondb_owner;

--
-- Name: cargas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cargas_id_seq OWNED BY public.cargas.id;


--
-- Name: configuracion; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.configuracion (
    clave text NOT NULL,
    valor text NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.configuracion OWNER TO neondb_owner;

--
-- Name: fuentes_diesel; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.fuentes_diesel (
    id integer NOT NULL,
    nombre text NOT NULL,
    tipo character varying(20) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.fuentes_diesel OWNER TO neondb_owner;

--
-- Name: fuentes_diesel_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.fuentes_diesel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fuentes_diesel_id_seq OWNER TO neondb_owner;

--
-- Name: fuentes_diesel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.fuentes_diesel_id_seq OWNED BY public.fuentes_diesel.id;


--
-- Name: obras; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.obras (
    id integer NOT NULL,
    nombre text NOT NULL,
    cliente text,
    activo boolean DEFAULT true NOT NULL,
    fecha_inicio date,
    fecha_fin date,
    notas text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.obras OWNER TO neondb_owner;

--
-- Name: obras_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.obras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.obras_id_seq OWNER TO neondb_owner;

--
-- Name: obras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.obras_id_seq OWNED BY public.obras.id;


--
-- Name: operadores; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.operadores (
    id integer NOT NULL,
    nombre text NOT NULL,
    tipo character varying(20) DEFAULT 'chofer'::character varying NOT NULL,
    telefono character varying(20),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.operadores OWNER TO neondb_owner;

--
-- Name: operadores_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.operadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operadores_id_seq OWNER TO neondb_owner;

--
-- Name: operadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.operadores_id_seq OWNED BY public.operadores.id;


--
-- Name: pb_mensajes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pb_mensajes (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    contenido text NOT NULL,
    autor_id text NOT NULL,
    autor_nombre character varying(150) NOT NULL,
    autor_rol character varying(20) DEFAULT 'client'::character varying NOT NULL,
    leido boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pb_mensajes OWNER TO neondb_owner;

--
-- Name: pb_mensajes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pb_mensajes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pb_mensajes_id_seq OWNER TO neondb_owner;

--
-- Name: pb_mensajes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pb_mensajes_id_seq OWNED BY public.pb_mensajes.id;


--
-- Name: pb_modulos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pb_modulos (
    id integer NOT NULL,
    titulo character varying(200) NOT NULL,
    resumen text NOT NULL,
    descripcion text NOT NULL,
    categoria character varying(50) DEFAULT 'operaciones'::character varying NOT NULL,
    estado character varying(20) DEFAULT 'proposed'::character varying NOT NULL,
    costo_estimado integer DEFAULT 0 NOT NULL,
    dias_estimados integer DEFAULT 0 NOT NULL,
    progreso integer DEFAULT 0 NOT NULL,
    fase integer DEFAULT 1 NOT NULL,
    tema character varying(50) DEFAULT 'operaciones'::character varying NOT NULL,
    fase_package integer DEFAULT 1 NOT NULL,
    impacto text,
    casos_uso text,
    beneficios text,
    dependencias text,
    notas_tecnicas text,
    aprobado_at timestamp without time zone,
    aprobado_por text,
    iniciado_at timestamp without time zone,
    completado_at timestamp without time zone,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pb_modulos OWNER TO neondb_owner;

--
-- Name: pb_modulos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pb_modulos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pb_modulos_id_seq OWNER TO neondb_owner;

--
-- Name: pb_modulos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pb_modulos_id_seq OWNED BY public.pb_modulos.id;


--
-- Name: pb_novedades; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pb_novedades (
    id integer NOT NULL,
    titulo character varying(200) NOT NULL,
    contenido text NOT NULL,
    tipo character varying(30) DEFAULT 'update'::character varying NOT NULL,
    modulo_id integer,
    leido boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pb_novedades OWNER TO neondb_owner;

--
-- Name: pb_novedades_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pb_novedades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pb_novedades_id_seq OWNER TO neondb_owner;

--
-- Name: pb_novedades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pb_novedades_id_seq OWNED BY public.pb_novedades.id;


--
-- Name: pb_tickets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pb_tickets (
    id integer NOT NULL,
    titulo character varying(200) NOT NULL,
    descripcion text NOT NULL,
    tipo character varying(30) NOT NULL,
    estado character varying(20) DEFAULT 'open'::character varying NOT NULL,
    prioridad character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    modulo_id integer,
    creado_por_id text NOT NULL,
    creado_por_nombre character varying(150) NOT NULL,
    resuelta_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pb_tickets OWNER TO neondb_owner;

--
-- Name: pb_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pb_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pb_tickets_id_seq OWNER TO neondb_owner;

--
-- Name: pb_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pb_tickets_id_seq OWNED BY public.pb_tickets.id;


--
-- Name: periodos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.periodos (
    id integer NOT NULL,
    nombre text NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    cerrado boolean DEFAULT false NOT NULL,
    cerrado_por_id text,
    cerrado_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.periodos OWNER TO neondb_owner;

--
-- Name: periodos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.periodos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.periodos_id_seq OWNER TO neondb_owner;

--
-- Name: periodos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.periodos_id_seq OWNED BY public.periodos.id;


--
-- Name: recargas_tanque; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.recargas_tanque (
    id integer NOT NULL,
    fecha date NOT NULL,
    litros real NOT NULL,
    proveedor text,
    folio_factura text,
    precio_litro real,
    tanque_id integer NOT NULL,
    registrado_por_id text,
    notas text,
    created_at timestamp without time zone DEFAULT now(),
    cuentalitros_inicio real
);


ALTER TABLE public.recargas_tanque OWNER TO neondb_owner;

--
-- Name: recargas_tanque_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.recargas_tanque_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recargas_tanque_id_seq OWNER TO neondb_owner;

--
-- Name: recargas_tanque_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.recargas_tanque_id_seq OWNED BY public.recargas_tanque.id;


--
-- Name: rendimientos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rendimientos (
    id integer NOT NULL,
    periodo_id integer NOT NULL,
    unidad_id integer NOT NULL,
    operador_id integer,
    odometro_inicial real,
    odometro_final real,
    km_hrs_recorridos real,
    litros_consumidos real NOT NULL,
    rendimiento_actual real,
    rendimiento_referencia real,
    diferencia real,
    dentro_tolerancia boolean,
    notas text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.rendimientos OWNER TO neondb_owner;

--
-- Name: rendimientos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.rendimientos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rendimientos_id_seq OWNER TO neondb_owner;

--
-- Name: rendimientos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.rendimientos_id_seq OWNED BY public.rendimientos.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id text NOT NULL,
    label text NOT NULL,
    permisos text DEFAULT '[]'::text NOT NULL,
    is_system boolean DEFAULT false NOT NULL
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: tanques; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tanques (
    id integer NOT NULL,
    nombre text NOT NULL,
    capacidad_max real NOT NULL,
    litros_actuales real DEFAULT 0 NOT NULL,
    cuentalitros_actual real DEFAULT 0,
    ajuste_porcentaje real DEFAULT 2,
    ultima_actualizacion timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tanques OWNER TO neondb_owner;

--
-- Name: tanques_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tanques_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tanques_id_seq OWNER TO neondb_owner;

--
-- Name: tanques_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tanques_id_seq OWNED BY public.tanques.id;


--
-- Name: transferencias_tanque; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transferencias_tanque (
    id integer NOT NULL,
    fecha date NOT NULL,
    litros real NOT NULL,
    tanque_origen_id integer NOT NULL,
    tanque_destino_id integer NOT NULL,
    registrado_por_id text,
    notas text,
    created_at timestamp without time zone DEFAULT now(),
    folio integer,
    cuentalitros_nissan_inicio real,
    cuentalitros_destino real
);


ALTER TABLE public.transferencias_tanque OWNER TO neondb_owner;

--
-- Name: transferencias_tanque_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.transferencias_tanque_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transferencias_tanque_id_seq OWNER TO neondb_owner;

--
-- Name: transferencias_tanque_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.transferencias_tanque_id_seq OWNED BY public.transferencias_tanque.id;


--
-- Name: unidades; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.unidades (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre text,
    tipo character varying(20) NOT NULL,
    modelo text,
    operador_default_id integer,
    capacidad_tanque real,
    odometro_actual real DEFAULT 0,
    rendimiento_referencia real,
    activo boolean DEFAULT true NOT NULL,
    notas text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.unidades OWNER TO neondb_owner;

--
-- Name: unidades_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.unidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unidades_id_seq OWNER TO neondb_owner;

--
-- Name: unidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.unidades_id_seq OWNED BY public.unidades.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role character varying(50) DEFAULT 'despachador'::character varying NOT NULL,
    phone character varying(20),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: analytics_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analytics_events ALTER COLUMN id SET DEFAULT nextval('public.analytics_events_id_seq'::regclass);


--
-- Name: analytics_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analytics_sessions ALTER COLUMN id SET DEFAULT nextval('public.analytics_sessions_id_seq'::regclass);


--
-- Name: archivos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archivos ALTER COLUMN id SET DEFAULT nextval('public.archivos_id_seq'::regclass);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: cargas id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cargas ALTER COLUMN id SET DEFAULT nextval('public.cargas_id_seq'::regclass);


--
-- Name: fuentes_diesel id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fuentes_diesel ALTER COLUMN id SET DEFAULT nextval('public.fuentes_diesel_id_seq'::regclass);


--
-- Name: obras id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.obras ALTER COLUMN id SET DEFAULT nextval('public.obras_id_seq'::regclass);


--
-- Name: operadores id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.operadores ALTER COLUMN id SET DEFAULT nextval('public.operadores_id_seq'::regclass);


--
-- Name: pb_mensajes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pb_mensajes ALTER COLUMN id SET DEFAULT nextval('public.pb_mensajes_id_seq'::regclass);


--
-- Name: pb_modulos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pb_modulos ALTER COLUMN id SET DEFAULT nextval('public.pb_modulos_id_seq'::regclass);


--
-- Name: pb_novedades id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pb_novedades ALTER COLUMN id SET DEFAULT nextval('public.pb_novedades_id_seq'::regclass);


--
-- Name: pb_tickets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pb_tickets ALTER COLUMN id SET DEFAULT nextval('public.pb_tickets_id_seq'::regclass);


--
-- Name: periodos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.periodos ALTER COLUMN id SET DEFAULT nextval('public.periodos_id_seq'::regclass);


--
-- Name: recargas_tanque id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recargas_tanque ALTER COLUMN id SET DEFAULT nextval('public.recargas_tanque_id_seq'::regclass);


--
-- Name: rendimientos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rendimientos ALTER COLUMN id SET DEFAULT nextval('public.rendimientos_id_seq'::regclass);


--
-- Name: tanques id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tanques ALTER COLUMN id SET DEFAULT nextval('public.tanques_id_seq'::regclass);


--
-- Name: transferencias_tanque id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transferencias_tanque ALTER COLUMN id SET DEFAULT nextval('public.transferencias_tanque_id_seq'::regclass);


--
-- Name: unidades id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.unidades ALTER COLUMN id SET DEFAULT nextval('public.unidades_id_seq'::regclass);


--
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.analytics_events (id, session_id, type, element, x_pct, y_pct, value, created_at) FROM stdin;
1	e623a5ac-67a1-4a6f-bcd2-05b5b83adb78	scroll	\N	\N	\N	75	2026-05-22 01:12:57.031053
2	e623a5ac-67a1-4a6f-bcd2-05b5b83adb78	scroll	\N	\N	\N	100	2026-05-22 01:12:57.048085
3	e623a5ac-67a1-4a6f-bcd2-05b5b83adb78	scroll	\N	\N	\N	25	2026-05-22 01:12:57.061272
4	e623a5ac-67a1-4a6f-bcd2-05b5b83adb78	scroll	\N	\N	\N	50	2026-05-22 01:12:57.07046
5	e623a5ac-67a1-4a6f-bcd2-05b5b83adb78	click	Solicitar cotización	29	30	\N	2026-05-22 01:13:00.487979
6	e623a5ac-67a1-4a6f-bcd2-05b5b83adb78	click	Ver servicios	42	30	\N	2026-05-22 01:13:06.681761
7	e623a5ac-67a1-4a6f-bcd2-05b5b83adb78	scroll	\N	\N	\N	25	2026-05-22 01:13:08.522965
8	e623a5ac-67a1-4a6f-bcd2-05b5b83adb78	scroll	\N	\N	\N	50	2026-05-22 01:13:08.584343
9	99a2c8b9-2c39-4bc4-b9dd-337c65fe2ed8	scroll	\N	\N	\N	25	2026-05-22 01:13:13.840775
10	99a2c8b9-2c39-4bc4-b9dd-337c65fe2ed8	scroll	\N	\N	\N	50	2026-05-22 01:13:13.873704
11	99a2c8b9-2c39-4bc4-b9dd-337c65fe2ed8	scroll	\N	\N	\N	100	2026-05-22 01:13:13.922287
12	99a2c8b9-2c39-4bc4-b9dd-337c65fe2ed8	scroll	\N	\N	\N	75	2026-05-22 01:13:13.925504
13	3e7f0bf7-8a9f-4943-8ed2-740053b8e724	scroll	\N	\N	\N	25	2026-05-22 01:13:16.286845
14	3e7f0bf7-8a9f-4943-8ed2-740053b8e724	scroll	\N	\N	\N	50	2026-05-22 01:13:16.482399
15	3e7f0bf7-8a9f-4943-8ed2-740053b8e724	scroll	\N	\N	\N	75	2026-05-22 01:13:16.800848
16	3e7f0bf7-8a9f-4943-8ed2-740053b8e724	scroll	\N	\N	\N	100	2026-05-22 01:13:17.040127
17	ec052e01-1f3d-4c83-a499-76bedff413b3	click	Ver servicios	30	21	\N	2026-05-22 01:14:55.610596
18	ec052e01-1f3d-4c83-a499-76bedff413b3	scroll	\N	\N	\N	25	2026-05-22 01:14:56.079519
19	ec052e01-1f3d-4c83-a499-76bedff413b3	click	ConstrucciónComercial Obras comerciales e industriales. Supervisión técnica de i	18	37	\N	2026-05-22 01:14:57.694921
20	ec052e01-1f3d-4c83-a499-76bedff413b3	click	Excavación Excavaciones de cimentación, zanjas y terracería con maquinaria de al	81	43	\N	2026-05-22 01:14:59.268941
21	6181cdf9-5b14-428e-a7a6-66905624aad1	scroll	\N	\N	\N	25	2026-05-22 18:43:35.588345
22	6181cdf9-5b14-428e-a7a6-66905624aad1	scroll	\N	\N	\N	50	2026-05-22 18:43:36.680091
23	6181cdf9-5b14-428e-a7a6-66905624aad1	scroll	\N	\N	\N	75	2026-05-22 18:43:36.869552
24	c3623773-e2b4-4eea-8b61-3ab0998dca28	click	Solicitar cotización	0	0	\N	2026-05-23 00:56:12.177817
25	c3623773-e2b4-4eea-8b61-3ab0998dca28	click	a	0	0	\N	2026-05-23 00:56:12.211948
26	c3623773-e2b4-4eea-8b61-3ab0998dca28	click	Cobertura	0	0	\N	2026-05-23 00:56:12.700114
27	c3623773-e2b4-4eea-8b61-3ab0998dca28	click	a	0	0	\N	2026-05-23 00:56:12.738214
28	c3623773-e2b4-4eea-8b61-3ab0998dca28	click	@wbconstruccion	0	0	\N	2026-05-23 00:56:12.770822
29	a67ef9f8-e5cc-40a4-8950-2d6017de1c8f	scroll	\N	\N	\N	75	2026-05-23 00:56:23.000207
30	a67ef9f8-e5cc-40a4-8950-2d6017de1c8f	scroll	\N	\N	\N	25	2026-05-23 00:56:23.026837
31	a67ef9f8-e5cc-40a4-8950-2d6017de1c8f	scroll	\N	\N	\N	50	2026-05-23 00:56:23.030116
32	a67ef9f8-e5cc-40a4-8950-2d6017de1c8f	scroll	\N	\N	\N	100	2026-05-23 00:56:23.141966
33	d44c4e3d-4d0f-4337-a0d8-655e80e79f09	click	Ver servicios	43	20	\N	2026-05-23 14:45:26.315985
34	d44c4e3d-4d0f-4337-a0d8-655e80e79f09	scroll	\N	\N	\N	25	2026-05-23 14:45:26.471316
35	d44c4e3d-4d0f-4337-a0d8-655e80e79f09	scroll	\N	\N	\N	50	2026-05-23 14:45:29.211014
36	d44c4e3d-4d0f-4337-a0d8-655e80e79f09	scroll	\N	\N	\N	75	2026-05-23 14:45:34.816222
37	d44c4e3d-4d0f-4337-a0d8-655e80e79f09	scroll	\N	\N	\N	100	2026-05-23 14:45:41.821939
38	b29701f4-2e76-46cb-a4d7-2682f8435c9e	scroll	\N	\N	\N	25	2026-05-23 15:10:29.292169
39	b29701f4-2e76-46cb-a4d7-2682f8435c9e	scroll	\N	\N	\N	50	2026-05-23 15:10:35.153672
40	3f54984b-7f10-4e92-be31-523ad7de3d4f	scroll	\N	\N	\N	100	2026-05-23 15:21:13.167071
41	3f54984b-7f10-4e92-be31-523ad7de3d4f	scroll	\N	\N	\N	25	2026-05-23 15:21:13.196822
42	3f54984b-7f10-4e92-be31-523ad7de3d4f	scroll	\N	\N	\N	50	2026-05-23 15:21:13.21956
43	3f54984b-7f10-4e92-be31-523ad7de3d4f	scroll	\N	\N	\N	75	2026-05-23 15:21:13.250188
44	e95fc111-fde1-46b9-af44-be748eaa5173	scroll	\N	\N	\N	25	2026-05-23 22:35:05.049099
45	e95fc111-fde1-46b9-af44-be748eaa5173	scroll	\N	\N	\N	50	2026-05-23 22:35:09.358535
46	e95fc111-fde1-46b9-af44-be748eaa5173	scroll	\N	\N	\N	75	2026-05-23 22:35:17.53654
47	e95fc111-fde1-46b9-af44-be748eaa5173	scroll	\N	\N	\N	100	2026-05-23 22:35:20.139312
48	04e07121-14bc-4166-aed0-b82973cd8033	scroll	\N	\N	\N	25	2026-05-25 05:02:42.473762
49	04e07121-14bc-4166-aed0-b82973cd8033	scroll	\N	\N	\N	50	2026-05-25 05:02:44.179681
50	f2b7542c-8e7d-460b-a387-1b4980df823c	scroll	\N	\N	\N	50	2026-05-25 19:24:03.517037
51	f2b7542c-8e7d-460b-a387-1b4980df823c	scroll	\N	\N	\N	75	2026-05-25 19:24:03.544519
52	f2b7542c-8e7d-460b-a387-1b4980df823c	scroll	\N	\N	\N	25	2026-05-25 19:24:03.567048
53	f2b7542c-8e7d-460b-a387-1b4980df823c	scroll	\N	\N	\N	100	2026-05-25 19:24:03.603808
54	271cb305-5e75-4c22-a76f-832c7d9ffc27	scroll	\N	\N	\N	25	2026-05-26 16:14:04.422441
55	271cb305-5e75-4c22-a76f-832c7d9ffc27	scroll	\N	\N	\N	50	2026-05-26 16:14:04.658505
56	271cb305-5e75-4c22-a76f-832c7d9ffc27	scroll	\N	\N	\N	75	2026-05-26 16:14:04.876867
57	271cb305-5e75-4c22-a76f-832c7d9ffc27	scroll	\N	\N	\N	100	2026-05-26 16:14:04.972065
58	271cb305-5e75-4c22-a76f-832c7d9ffc27	click	Servicios	62	1	\N	2026-05-26 16:14:11.741847
59	b71eb5f0-8bfd-4932-b46f-61a18c579ce2	scroll	\N	\N	\N	25	2026-05-26 18:57:43.282916
60	b71eb5f0-8bfd-4932-b46f-61a18c579ce2	scroll	\N	\N	\N	50	2026-05-26 18:57:44.422732
61	b71eb5f0-8bfd-4932-b46f-61a18c579ce2	scroll	\N	\N	\N	75	2026-05-26 18:57:46.357941
62	b71eb5f0-8bfd-4932-b46f-61a18c579ce2	click	admin2@wbco.mx	22	75	\N	2026-05-26 18:57:52.43393
63	b71eb5f0-8bfd-4932-b46f-61a18c579ce2	click	Correo electrónico admin2@wbco.mx	17	75	\N	2026-05-26 18:57:58.662055
64	a5939083-a740-4c13-8465-09882f4f3740	scroll	\N	\N	\N	25	2026-05-27 20:09:04.781999
65	a5939083-a740-4c13-8465-09882f4f3740	scroll	\N	\N	\N	50	2026-05-27 20:09:05.101677
66	a5939083-a740-4c13-8465-09882f4f3740	scroll	\N	\N	\N	75	2026-05-27 20:09:05.245987
67	a5939083-a740-4c13-8465-09882f4f3740	scroll	\N	\N	\N	100	2026-05-27 20:09:05.436521
68	a5939083-a740-4c13-8465-09882f4f3740	click	Camiones de Volteo	53	93	\N	2026-05-27 20:10:43.017407
69	a5939083-a740-4c13-8465-09882f4f3740	click	Camionesde Volteo Acarreo de tierra, grava y materiales. Disponibilidad inmediat	56	51	\N	2026-05-27 20:10:45.075437
70	a5939083-a740-4c13-8465-09882f4f3740	click	Sede principal Monterrey Nuevo León, México	23	79	\N	2026-05-27 20:10:51.492351
71	a5939083-a740-4c13-8465-09882f4f3740	click	Sede principal Monterrey Nuevo León, México	26	78	\N	2026-05-27 20:10:51.859772
72	a5939083-a740-4c13-8465-09882f4f3740	click	Sede principal Monterrey Nuevo León, México	27	79	\N	2026-05-27 20:10:52.179865
73	a5939083-a740-4c13-8465-09882f4f3740	click	Servicios	57	1	\N	2026-05-27 20:55:09.784814
74	b2ca4257-d533-45bb-aeb0-31fe9f3e8e8b	click	button	90	1	\N	2026-05-27 21:08:43.490173
75	499a99a7-8b9f-46d2-bea9-98eb99880c20	scroll	\N	\N	\N	25	2026-05-27 21:08:51.223252
76	499a99a7-8b9f-46d2-bea9-98eb99880c20	scroll	\N	\N	\N	50	2026-05-27 21:08:52.862404
77	55b37c04-2433-4995-975a-31bb91dd3d5b	scroll	\N	\N	\N	25	2026-05-28 15:41:09.196666
78	55b37c04-2433-4995-975a-31bb91dd3d5b	scroll	\N	\N	\N	50	2026-05-28 15:41:09.92137
79	55b37c04-2433-4995-975a-31bb91dd3d5b	scroll	\N	\N	\N	75	2026-05-28 15:41:11.147193
80	4a43d5b9-9677-4998-a01d-3e48af333b06	scroll	\N	\N	\N	25	2026-05-28 16:01:27.613901
81	4a43d5b9-9677-4998-a01d-3e48af333b06	scroll	\N	\N	\N	75	2026-05-28 16:01:27.840062
82	4a43d5b9-9677-4998-a01d-3e48af333b06	scroll	\N	\N	\N	50	2026-05-28 16:01:27.991853
83	4a43d5b9-9677-4998-a01d-3e48af333b06	scroll	\N	\N	\N	100	2026-05-28 16:01:28.241572
84	bd7a45b5-68a6-4988-a60c-311d370910c2	scroll	\N	\N	\N	25	2026-05-28 16:04:12.772683
85	bd7a45b5-68a6-4988-a60c-311d370910c2	scroll	\N	\N	\N	50	2026-05-28 16:04:12.940986
86	bd7a45b5-68a6-4988-a60c-311d370910c2	scroll	\N	\N	\N	75	2026-05-28 16:04:13.025743
87	bd7a45b5-68a6-4988-a60c-311d370910c2	scroll	\N	\N	\N	100	2026-05-28 16:04:13.141009
88	ba73f553-2466-4fa5-8f14-c3692bb3c75e	scroll	\N	\N	\N	25	2026-05-28 16:46:58.973499
89	ba73f553-2466-4fa5-8f14-c3692bb3c75e	scroll	\N	\N	\N	50	2026-05-28 16:47:11.286902
90	ba73f553-2466-4fa5-8f14-c3692bb3c75e	scroll	\N	\N	\N	75	2026-05-28 16:47:14.110379
91	ba73f553-2466-4fa5-8f14-c3692bb3c75e	scroll	\N	\N	\N	100	2026-05-28 16:47:26.966214
92	ba73f553-2466-4fa5-8f14-c3692bb3c75e	click	a	26	96	\N	2026-05-28 16:47:43.8909
93	ba73f553-2466-4fa5-8f14-c3692bb3c75e	click	PoxelBit	79	99	\N	2026-05-28 16:48:02.302278
94	dafa4aa4-5a12-494b-8aa9-94dfee579f9b	scroll	\N	\N	\N	25	2026-05-29 17:36:50.750227
95	dafa4aa4-5a12-494b-8aa9-94dfee579f9b	click	Servicios	62	1	\N	2026-05-29 17:36:50.798569
96	dafa4aa4-5a12-494b-8aa9-94dfee579f9b	scroll	\N	\N	\N	50	2026-05-29 17:36:54.718753
97	dafa4aa4-5a12-494b-8aa9-94dfee579f9b	scroll	\N	\N	\N	75	2026-05-29 17:37:14.764369
98	dafa4aa4-5a12-494b-8aa9-94dfee579f9b	scroll	\N	\N	\N	100	2026-05-29 17:37:39.20779
99	dafa4aa4-5a12-494b-8aa9-94dfee579f9b	click	PoxelBit	79	99	\N	2026-05-29 17:37:46.400806
100	9ed3497d-1e51-4efe-8584-f876f938ddcc	scroll	\N	\N	\N	25	2026-06-06 17:18:37.033182
101	9ed3497d-1e51-4efe-8584-f876f938ddcc	scroll	\N	\N	\N	50	2026-06-06 17:18:37.57585
102	9ed3497d-1e51-4efe-8584-f876f938ddcc	scroll	\N	\N	\N	75	2026-06-06 17:18:37.926616
103	9ed3497d-1e51-4efe-8584-f876f938ddcc	scroll	\N	\N	\N	100	2026-06-06 17:18:38.04348
104	9ed3497d-1e51-4efe-8584-f876f938ddcc	click	Teléfono / WhatsApp 818 465 6755 Monterrey, Nuevo León · Lun–Vie 8–18 hrs	25	71	\N	2026-06-06 17:19:23.195031
105	9acf80f4-02b0-49c0-a4a3-d7fccd78e3a8	scroll	\N	\N	\N	25	2026-06-09 03:38:49.340133
106	9acf80f4-02b0-49c0-a4a3-d7fccd78e3a8	click	Camionesde Volteo Acarreo de tierra, grava y materiales. Disponibilidad inmediat	16	43	\N	2026-06-09 03:38:52.380601
107	9acf80f4-02b0-49c0-a4a3-d7fccd78e3a8	click	Camionesde Volteo Acarreo de tierra, grava y materiales. Disponibilidad inmediat	17	44	\N	2026-06-09 03:38:54.062318
108	9acf80f4-02b0-49c0-a4a3-d7fccd78e3a8	scroll	\N	\N	\N	50	2026-06-09 03:38:55.081962
109	9acf80f4-02b0-49c0-a4a3-d7fccd78e3a8	scroll	\N	\N	\N	50	2026-06-09 03:39:02.348178
110	9acf80f4-02b0-49c0-a4a3-d7fccd78e3a8	scroll	\N	\N	\N	25	2026-06-09 03:39:02.371775
111	b2876ac6-7067-4fa0-8b34-f4726588f984	scroll	\N	\N	\N	25	2026-06-09 21:49:08.093123
112	4ed63f7f-1518-4310-b0ac-80f969597294	scroll	\N	\N	\N	25	2026-06-09 21:50:23.634818
113	4ed63f7f-1518-4310-b0ac-80f969597294	scroll	\N	\N	\N	50	2026-06-09 21:50:26.170733
115	4ed63f7f-1518-4310-b0ac-80f969597294	scroll	\N	\N	\N	75	2026-06-09 22:09:02.002213
114	4ed63f7f-1518-4310-b0ac-80f969597294	scroll	\N	\N	\N	100	2026-06-09 22:09:02.017893
116	dae5c103-742c-480a-a31b-d74c5b348106	click	Ver servicios	40	27	\N	2026-06-10 18:29:34.702674
117	dae5c103-742c-480a-a31b-d74c5b348106	scroll	\N	\N	\N	25	2026-06-10 18:29:34.99975
118	dae5c103-742c-480a-a31b-d74c5b348106	scroll	\N	\N	\N	50	2026-06-10 18:29:35.908027
119	ab829ceb-4de6-4e1d-b699-608dba9b1b75	scroll	\N	\N	\N	25	2026-06-10 21:45:44.029872
120	ab829ceb-4de6-4e1d-b699-608dba9b1b75	scroll	\N	\N	\N	50	2026-06-10 21:45:47.558991
121	ab829ceb-4de6-4e1d-b699-608dba9b1b75	scroll	\N	\N	\N	75	2026-06-10 21:45:48.562327
122	ab829ceb-4de6-4e1d-b699-608dba9b1b75	scroll	\N	\N	\N	100	2026-06-10 21:45:50.420943
123	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	Servicios	63	1	\N	2026-06-10 21:45:54.313869
124	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	Cobertura	69	36	\N	2026-06-10 21:45:55.757045
125	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	Servicios	62	59	\N	2026-06-10 21:45:57.48113
126	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	a	19	1	\N	2026-06-10 21:46:00.22104
127	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	Ver servicios	42	27	\N	2026-06-10 21:46:05.291174
128	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	ConstrucciónComercial Obras comerciales e industriales. Supervisión técnica de i	24	49	\N	2026-06-10 21:46:06.151998
129	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	ConstrucciónComercial Obras comerciales e industriales. Supervisión técnica de i	24	53	\N	2026-06-10 21:46:08.57755
130	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	ConstrucciónComercial Obras comerciales e industriales. Supervisión técnica de i	25	50	\N	2026-06-10 21:46:09.550381
131	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	ConstrucciónComercial Obras comerciales e industriales. Supervisión técnica de i	25	50	\N	2026-06-10 21:46:09.740436
132	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	WB Renta deMaquinaria Retroexcavadoras, cargadores y equipo especializado con o 	40	51	\N	2026-06-10 21:46:10.157935
133	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	Camionesde Volteo Acarreo de tierra, grava y materiales. Disponibilidad inmediat	57	50	\N	2026-06-10 21:46:10.629619
134	ab829ceb-4de6-4e1d-b699-608dba9b1b75	click	Excavación Excavaciones de cimentación, zanjas y terracería con maquinaria de al	82	51	\N	2026-06-10 21:46:11.229474
135	a9407178-a399-4955-af62-35b99288b209	scroll	\N	\N	\N	25	2026-06-10 21:47:10.072409
136	a9407178-a399-4955-af62-35b99288b209	scroll	\N	\N	\N	50	2026-06-10 21:47:10.895578
137	a9407178-a399-4955-af62-35b99288b209	scroll	\N	\N	\N	75	2026-06-10 21:47:10.927634
138	a9407178-a399-4955-af62-35b99288b209	click	button	94	74	\N	2026-06-10 21:47:11.700155
139	a9407178-a399-4955-af62-35b99288b209	click	Cobertura	20	3	\N	2026-06-10 21:47:16.744996
140	a9407178-a399-4955-af62-35b99288b209	click	button	93	24	\N	2026-06-10 21:47:19.954804
141	a9407178-a399-4955-af62-35b99288b209	click	Servicios	16	26	\N	2026-06-10 21:47:20.687589
142	7c86a6a4-012e-46b9-8950-6188c40c8850	scroll	\N	\N	\N	25	2026-06-11 18:14:12.51995
143	7c86a6a4-012e-46b9-8950-6188c40c8850	scroll	\N	\N	\N	50	2026-06-11 18:14:24.341444
144	7c86a6a4-012e-46b9-8950-6188c40c8850	scroll	\N	\N	\N	75	2026-06-11 18:14:25.589618
145	7c86a6a4-012e-46b9-8950-6188c40c8850	click	button	92	1	\N	2026-06-11 18:14:31.753796
146	7c86a6a4-012e-46b9-8950-6188c40c8850	click	Servicios	10	2	\N	2026-06-11 18:14:34.355941
147	7c86a6a4-012e-46b9-8950-6188c40c8850	click	ConstrucciónComercial Obras comerciales e industriales. Supervisión técnica de i	18	34	\N	2026-06-11 18:14:35.920597
148	dc68f6a0-d088-4317-b51d-c84461fe5b99	scroll	\N	\N	\N	25	2026-06-12 20:48:33.041351
149	dc68f6a0-d088-4317-b51d-c84461fe5b99	scroll	\N	\N	\N	50	2026-06-12 20:48:33.372314
150	dc68f6a0-d088-4317-b51d-c84461fe5b99	scroll	\N	\N	\N	75	2026-06-12 20:48:36.037662
151	dc68f6a0-d088-4317-b51d-c84461fe5b99	scroll	\N	\N	\N	100	2026-06-12 20:48:36.549879
152	3a3643e9-18f8-486f-82e6-d89ed817c4a8	scroll	\N	\N	\N	25	2026-06-13 00:43:13.312088
153	3a3643e9-18f8-486f-82e6-d89ed817c4a8	scroll	\N	\N	\N	50	2026-06-13 00:43:15.662886
154	22a957f7-dd48-4529-9709-962ee7d549ee	scroll	\N	\N	\N	25	2026-06-16 21:26:37.617927
155	22a957f7-dd48-4529-9709-962ee7d549ee	scroll	\N	\N	\N	50	2026-06-16 21:26:39.961638
156	22a957f7-dd48-4529-9709-962ee7d549ee	scroll	\N	\N	\N	75	2026-06-16 21:26:49.92293
157	22a957f7-dd48-4529-9709-962ee7d549ee	scroll	\N	\N	\N	100	2026-06-16 21:26:53.694416
158	22a957f7-dd48-4529-9709-962ee7d549ee	click	Sede principal Monterrey Nuevo León, México	69	60	\N	2026-06-16 21:27:18.497101
159	22a957f7-dd48-4529-9709-962ee7d549ee	click	Sede principal Monterrey Nuevo León, México	37	60	\N	2026-06-16 21:27:21.014192
160	22a957f7-dd48-4529-9709-962ee7d549ee	click	button	91	1	\N	2026-06-16 21:27:31.3446
161	22a957f7-dd48-4529-9709-962ee7d549ee	click	button	89	1	\N	2026-06-16 21:27:33.107389
162	99bf3899-e685-479b-89bf-87571acf907a	click	button	90	1	\N	2026-06-17 19:35:33.060916
163	99bf3899-e685-479b-89bf-87571acf907a	click	button	92	1	\N	2026-06-17 19:35:35.171684
164	99bf3899-e685-479b-89bf-87571acf907a	scroll	\N	\N	\N	25	2026-06-17 19:35:36.281644
165	99bf3899-e685-479b-89bf-87571acf907a	scroll	\N	\N	\N	50	2026-06-17 19:35:55.405288
166	99bf3899-e685-479b-89bf-87571acf907a	scroll	\N	\N	\N	75	2026-06-17 19:36:02.35994
167	99bf3899-e685-479b-89bf-87571acf907a	scroll	\N	\N	\N	100	2026-06-17 19:36:07.089917
168	99bf3899-e685-479b-89bf-87571acf907a	click	Sede principal Monterrey Nuevo León, México	64	60	\N	2026-06-17 19:36:13.811105
169	99bf3899-e685-479b-89bf-87571acf907a	click	Sede principal Monterrey Nuevo León, México	34	60	\N	2026-06-17 19:36:14.827425
170	99bf3899-e685-479b-89bf-87571acf907a	click	Sede principal Monterrey Nuevo León, México	68	60	\N	2026-06-17 19:36:15.94405
171	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	click	Ver servicios	27	21	\N	2026-06-19 18:35:36.105128
172	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	scroll	\N	\N	\N	25	2026-06-19 18:35:36.174732
173	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	click	Excavación Excavaciones de cimentación, zanjas y terracería con maquinaria de al	76	44	\N	2026-06-19 18:35:44.093143
174	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	click	WB Renta deMaquinaria Retroexcavadoras, cargadores y equipo especializado con o 	66	37	\N	2026-06-19 18:35:57.12028
175	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	click	Camionesde Volteo Acarreo de tierra, grava y materiales. Disponibilidad inmediat	17	42	\N	2026-06-19 18:35:58.971795
176	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	scroll	\N	\N	\N	50	2026-06-19 18:36:01.775338
177	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	scroll	\N	\N	\N	75	2026-06-19 18:36:11.567351
178	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	scroll	\N	\N	\N	100	2026-06-19 18:36:31.21399
179	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	click	button	89	1	\N	2026-06-19 18:36:43.766508
180	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	click	Cobertura	16	3	\N	2026-06-19 18:36:45.825865
181	fa8d2cff-32b5-47d8-9b54-eb8c4095e9b0	scroll	\N	\N	\N	25	2026-06-22 22:14:20.395706
182	fa8d2cff-32b5-47d8-9b54-eb8c4095e9b0	scroll	\N	\N	\N	50	2026-06-22 22:14:20.890205
183	fa8d2cff-32b5-47d8-9b54-eb8c4095e9b0	scroll	\N	\N	\N	75	2026-06-22 22:14:24.310468
184	fa8d2cff-32b5-47d8-9b54-eb8c4095e9b0	scroll	\N	\N	\N	100	2026-06-22 22:14:25.016011
185	ef041999-ccdb-46e3-b05c-690795ad5e25	click	Ver servicios	36	27	\N	2026-06-23 17:32:52.20399
186	ef041999-ccdb-46e3-b05c-690795ad5e25	click	Ver servicios	36	28	\N	2026-06-23 17:32:52.274432
187	ef041999-ccdb-46e3-b05c-690795ad5e25	scroll	\N	\N	\N	25	2026-06-23 17:32:52.304197
188	ef041999-ccdb-46e3-b05c-690795ad5e25	click	Camionesde Volteo Acarreo de tierra, grava y materiales. Disponibilidad inmediat	63	50	\N	2026-06-23 17:32:57.574459
189	ef041999-ccdb-46e3-b05c-690795ad5e25	click	Camionesde Volteo Acarreo de tierra, grava y materiales. Disponibilidad inmediat	61	50	\N	2026-06-23 17:32:58.46156
190	ef041999-ccdb-46e3-b05c-690795ad5e25	click	Excavación Excavaciones de cimentación, zanjas y terracería con maquinaria de al	84	50	\N	2026-06-23 17:32:59.215779
191	ef041999-ccdb-46e3-b05c-690795ad5e25	scroll	\N	\N	\N	50	2026-06-23 17:33:00.087367
192	ef041999-ccdb-46e3-b05c-690795ad5e25	scroll	\N	\N	\N	75	2026-06-23 17:33:01.75411
193	e7e17007-a443-4e6d-a157-a100e1bf7628	scroll	\N	\N	\N	25	2026-06-23 18:04:32.440252
194	e7e17007-a443-4e6d-a157-a100e1bf7628	scroll	\N	\N	\N	50	2026-06-23 18:04:32.528516
195	e7e17007-a443-4e6d-a157-a100e1bf7628	scroll	\N	\N	\N	75	2026-06-23 18:04:33.00351
196	e7e17007-a443-4e6d-a157-a100e1bf7628	scroll	\N	\N	\N	100	2026-06-23 18:04:33.384212
197	e7e17007-a443-4e6d-a157-a100e1bf7628	click	Teléfono / WhatsApp 818 465 6755 Monterrey, Nuevo León · Lun–Vie 8–18 hrs	24	72	\N	2026-06-23 18:04:46.792595
198	e7e17007-a443-4e6d-a157-a100e1bf7628	click	Correo electrónico admin2@wbco.mx	24	76	\N	2026-06-23 18:04:52.508216
199	e7e17007-a443-4e6d-a157-a100e1bf7628	click	Servicios	59	65	\N	2026-06-23 18:06:15.046359
200	35714994-7fbd-4a03-81d8-ddaeb3483bb6	scroll	\N	\N	\N	25	2026-06-23 19:11:16.931181
201	35714994-7fbd-4a03-81d8-ddaeb3483bb6	scroll	\N	\N	\N	50	2026-06-23 19:11:17.505177
202	35714994-7fbd-4a03-81d8-ddaeb3483bb6	scroll	\N	\N	\N	75	2026-06-23 19:11:21.473798
203	35714994-7fbd-4a03-81d8-ddaeb3483bb6	scroll	\N	\N	\N	100	2026-06-23 19:29:30.085111
204	6195db7e-3c33-4916-86a6-9d1992b5d5ef	scroll	\N	\N	\N	25	2026-06-24 08:16:34.230065
205	6195db7e-3c33-4916-86a6-9d1992b5d5ef	scroll	\N	\N	\N	50	2026-06-24 08:16:40.34159
206	6195db7e-3c33-4916-86a6-9d1992b5d5ef	scroll	\N	\N	\N	75	2026-06-24 08:16:43.062166
207	b72e8c78-f826-4df6-a827-0b3279358944	click	a	11	1	\N	2026-07-01 20:14:17.914722
208	b72e8c78-f826-4df6-a827-0b3279358944	click	a	12	1	\N	2026-07-01 20:14:19.131409
209	b72e8c78-f826-4df6-a827-0b3279358944	click	button	92	1	\N	2026-07-01 20:14:19.728084
210	b72e8c78-f826-4df6-a827-0b3279358944	click	button	91	1	\N	2026-07-01 20:14:21.535735
211	b72e8c78-f826-4df6-a827-0b3279358944	scroll	\N	\N	\N	25	2026-07-01 20:14:24.093531
212	b72e8c78-f826-4df6-a827-0b3279358944	scroll	\N	\N	\N	50	2026-07-01 20:14:26.741898
213	b72e8c78-f826-4df6-a827-0b3279358944	scroll	\N	\N	\N	75	2026-07-01 20:14:30.52771
214	b72e8c78-f826-4df6-a827-0b3279358944	scroll	\N	\N	\N	100	2026-07-01 20:14:33.843806
215	2bffe295-87c2-4a55-a4f2-b1537695b7ef	scroll	\N	\N	\N	25	2026-07-01 23:16:05.797214
216	2bffe295-87c2-4a55-a4f2-b1537695b7ef	scroll	\N	\N	\N	50	2026-07-01 23:17:57.094963
217	2bffe295-87c2-4a55-a4f2-b1537695b7ef	scroll	\N	\N	\N	25	2026-07-01 23:18:02.847964
218	b4e7d8dc-3f79-43b2-ad94-4ee644b428c5	click	a	28	1	\N	2026-07-02 13:38:16.032062
219	2c0d7bb2-132e-40f1-824a-3d040feadaf3	scroll	\N	\N	\N	25	2026-07-02 13:38:19.901053
220	2c0d7bb2-132e-40f1-824a-3d040feadaf3	scroll	\N	\N	\N	50	2026-07-02 13:38:20.185629
221	2c0d7bb2-132e-40f1-824a-3d040feadaf3	scroll	\N	\N	\N	75	2026-07-02 13:38:20.276432
222	2c0d7bb2-132e-40f1-824a-3d040feadaf3	scroll	\N	\N	\N	100	2026-07-02 13:38:20.651926
223	2c0d7bb2-132e-40f1-824a-3d040feadaf3	click	覆蓋範圍	68	2	\N	2026-07-02 13:38:52.90473
224	62679c4e-0074-477a-a092-0cc4a60d6e0b	scroll	\N	\N	\N	75	2026-07-04 19:14:26.369891
225	62679c4e-0074-477a-a092-0cc4a60d6e0b	scroll	\N	\N	\N	50	2026-07-04 19:14:26.409229
226	62679c4e-0074-477a-a092-0cc4a60d6e0b	scroll	\N	\N	\N	100	2026-07-04 19:14:26.5962
227	62679c4e-0074-477a-a092-0cc4a60d6e0b	scroll	\N	\N	\N	25	2026-07-04 19:14:26.957103
228	91c6d542-b079-43cd-96ea-9c29dc540bfb	scroll	\N	\N	\N	25	2026-07-06 10:30:06.334
229	91c6d542-b079-43cd-96ea-9c29dc540bfb	scroll	\N	\N	\N	50	2026-07-06 10:30:06.394263
230	91c6d542-b079-43cd-96ea-9c29dc540bfb	scroll	\N	\N	\N	75	2026-07-06 10:30:06.837841
231	91c6d542-b079-43cd-96ea-9c29dc540bfb	scroll	\N	\N	\N	100	2026-07-06 10:30:06.932984
232	91c6d542-b079-43cd-96ea-9c29dc540bfb	click	Servicios	62	1	\N	2026-07-06 10:31:05.043717
233	397022c4-286a-4fe5-8437-f739543fd916	scroll	\N	\N	\N	25	2026-07-07 06:46:19.340835
234	397022c4-286a-4fe5-8437-f739543fd916	click	a	27	33	\N	2026-07-07 06:46:22.0904
235	5df44d88-60c0-4a26-9b14-78b559e14953	scroll	\N	\N	\N	25	2026-07-10 20:07:46.019252
236	5df44d88-60c0-4a26-9b14-78b559e14953	click	Ver servicios	37	20	\N	2026-07-10 20:07:47.539926
237	5df44d88-60c0-4a26-9b14-78b559e14953	scroll	\N	\N	\N	50	2026-07-10 20:07:52.483095
238	5df44d88-60c0-4a26-9b14-78b559e14953	scroll	\N	\N	\N	75	2026-07-10 20:08:03.990405
239	5df44d88-60c0-4a26-9b14-78b559e14953	click	Enviar cotización por WhatsApp	85	78	\N	2026-07-10 20:08:53.003813
240	5df44d88-60c0-4a26-9b14-78b559e14953	click	818 465 6755	36	55	\N	2026-07-10 20:09:12.537376
\.


--
-- Data for Name: analytics_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.analytics_sessions (id, session_id, device_type, browser, os, screen_w, screen_h, referrer, ip_hash, duration_seconds, max_scroll_pct, bounced, ended_at, created_at) FROM stdin;
1	e623a5ac-67a1-4a6f-bcd2-05b5b83adb78	desktop	chrome	linux	1920	1080	\N	177.226	1	59	f	2026-05-22 01:13:09.461	2026-05-22 01:12:55.092225
3	99a2c8b9-2c39-4bc4-b9dd-337c65fe2ed8	desktop	chrome	linux	1920	1080	\N	177.226	2	100	f	2026-05-22 01:13:14.995	2026-05-22 01:13:12.529363
2	3e7f0bf7-8a9f-4943-8ed2-740053b8e724	desktop	chrome	windows	1600	900	\N	177.226	22	100	f	2026-05-22 01:13:25.08	2026-05-22 01:13:03.21345
35	80e40a6c-64e3-4fa4-91b4-138de940debf	desktop	chrome	macos	1600	1200	\N	23.27	7	0	t	2026-05-26 04:48:22.744	2026-05-26 04:48:16.527282
4	ec052e01-1f3d-4c83-a499-76bedff413b3	mobile	chrome	android	360	771	\N	177.226	24	37	f	2026-05-22 01:15:08.975	2026-05-22 01:14:44.570604
5	94a01ef4-b64f-44b9-ab3a-2bb9375d5d91	mobile	opera	android	424	946	\N	189.218	9	0	t	2026-05-22 11:21:43.64	2026-05-22 11:21:36.039693
6	a610f4ab-25ec-4a06-a1d1-20b4a0f6528a	mobile	opera	android	424	946	\N	186.96	7	0	t	2026-05-22 14:13:50.588	2026-05-22 14:13:45.314532
7	52ef669d-15dc-41f4-bc26-f8c7a20ac352	mobile	opera	android	424	946	\N	200.68	4	0	t	2026-05-22 14:40:45.763	2026-05-22 14:40:43.007736
8	150567cb-2e11-43b9-bfc3-c7917f14bb50	mobile	opera	android	424	946	\N	200.68	3	0	t	2026-05-22 15:08:38.114	2026-05-22 15:08:36.253949
9	6181cdf9-5b14-428e-a7a6-66905624aad1	mobile	chrome	android	424	946	https://l.instagram.com/	200.68	21	99	f	2026-05-22 18:43:53.034	2026-05-22 18:43:33.989671
10	83f8735f-b438-498a-8475-426fdf022a92	mobile	opera	android	424	946	\N	200.68	3	0	t	2026-05-22 20:06:11.241	2026-05-22 20:06:09.859635
11	1883e445-0fea-424c-96e2-806da2d542df	desktop	chrome	linux	1440	900	\N	177.226	9	0	t	2026-05-22 22:48:00.305	2026-05-22 22:47:53.016569
12	39aed413-b43b-48f4-a1a7-d1d851fa4c74	mobile	safari	ios	402	874	https://l.instagram.com/	200.68	\N	0	t	\N	2026-05-23 00:43:09.000851
13	c3623773-e2b4-4eea-8b61-3ab0998dca28	mobile	other	ios	2000	2000	http://m.facebook.com	173.252	\N	0	t	\N	2026-05-23 00:55:57.068061
14	f3588ede-5b99-4308-83ab-f0c7db4bd783	desktop	other	ios	440	956	http://m.facebook.com	173.252	\N	0	t	\N	2026-05-23 00:55:57.109421
15	a181bb10-123b-4a22-8067-9004d6be5f10	mobile	other	android	412	915	http://m.facebook.com	31.13	\N	0	t	\N	2026-05-23 00:55:57.578601
17	e4d6b8ef-9147-4c0c-a3a4-724dc2b9d726	mobile	other	android	412	915	http://m.facebook.com	173.252	\N	0	t	\N	2026-05-23 00:56:15.66876
18	0d908d4d-0973-4c38-9124-31a424a868a8	desktop	other	ios	440	956	http://m.facebook.com	66.220	\N	0	t	\N	2026-05-23 00:56:16.386966
19	a57c8869-aefd-400f-9a70-61dbc3112799	mobile	other	android	412	915	http://m.facebook.com	173.252	\N	0	t	\N	2026-05-23 00:56:16.772769
20	fa3eb36b-c02c-4b26-b12d-fdcc2fb9f61b	desktop	other	ios	440	956	http://m.facebook.com	31.13	\N	0	t	\N	2026-05-23 00:56:16.839731
16	a67ef9f8-e5cc-40a4-8950-2d6017de1c8f	mobile	chrome	android	2000	2000	https://www.facebook.com/	31.13	35	100	f	2026-05-23 00:56:32.579	2026-05-23 00:55:57.796953
21	a9e6b144-89c1-4374-8c49-27ba3f9edd3f	mobile	other	android	412	915	http://m.facebook.com	173.252	\N	0	t	\N	2026-05-23 00:58:24.776316
22	d44c4e3d-4d0f-4337-a0d8-655e80e79f09	mobile	safari	ios	402	874	https://l.instagram.com/	187.251	32	101	f	2026-05-23 14:45:48.095	2026-05-23 14:45:18.081874
23	b29701f4-2e76-46cb-a4d7-2682f8435c9e	mobile	chrome	android	384	832	https://l.instagram.com/	200.68	40	53	f	2026-05-23 15:10:42.959	2026-05-23 15:10:03.771914
24	3f54984b-7f10-4e92-be31-523ad7de3d4f	desktop	chrome	windows	1680	1050	\N	177.226	48	100	f	2026-05-23 15:21:14.55	2026-05-23 15:20:29.268214
25	e95fc111-fde1-46b9-af44-be748eaa5173	mobile	safari	ios	402	874	https://l.instagram.com/	187.189	29	101	f	2026-05-23 22:35:22.865	2026-05-23 22:34:55.441209
26	1b69eb22-1b3c-410f-afe7-60fd9879f1ef	mobile	opera	android	424	946	\N	189.218	14	0	f	2026-05-25 04:57:17.501	2026-05-25 04:57:05.296667
27	04e07121-14bc-4166-aed0-b82973cd8033	mobile	safari	ios	402	874	https://l.instagram.com/	187.251	10	72	f	2026-05-25 05:02:48.315	2026-05-25 05:02:37.900676
28	ebeb7cae-10fc-47f9-85e5-5065afa86358	mobile	opera	android	424	946	\N	200.68	8	0	t	2026-05-25 15:15:42.577	2026-05-25 15:15:35.749546
36	271cb305-5e75-4c22-a76f-832c7d9ffc27	desktop	chrome	windows	1536	864	https://www.bing.com/	189.153	15	100	f	2026-05-26 16:14:18.146	2026-05-26 16:14:04.400242
41	a2144879-bca7-4c5b-aa96-1622f763c8ca	mobile	opera	android	424	946	\N	200.68	8	0	t	2026-05-26 23:54:53.288	2026-05-26 23:54:46.636222
37	b71eb5f0-8bfd-4932-b46f-61a18c579ce2	desktop	chrome	windows	1512	851	https://l.instagram.com/	189.224	20	85	f	2026-05-26 18:58:00.659	2026-05-26 18:57:42.057167
29	f2b7542c-8e7d-460b-a387-1b4980df823c	desktop	edge	windows	1366	768	https://www.bing.com/	187.195	589	100	f	2026-05-25 19:31:46.52	2026-05-25 19:21:59.325599
30	cec1de30-8c2e-49c0-bc2a-88b31980cb61	mobile	opera	android	424	946	\N	200.68	7	0	t	2026-05-25 22:04:25.073	2026-05-25 22:04:19.1359
31	9bb1d20f-d23a-4d86-8796-4d2eaccaf557	mobile	opera	android	424	946	\N	186.96	5	0	t	2026-05-25 23:18:16.367	2026-05-25 23:18:11.789749
32	ba8906e6-e073-4d7d-b61d-e139b3b7aace	mobile	opera	android	424	946	\N	200.68	8	0	t	2026-05-26 00:50:36.584	2026-05-26 00:50:30.417991
33	40e30e8b-7ca2-4414-ad44-404cfe7b45b2	mobile	opera	android	424	946	\N	189.218	7	0	t	2026-05-26 03:13:19.874	2026-05-26 03:13:14.082402
34	785bee32-1225-4ef6-89a8-7e3f60662557	desktop	chrome	windows	1600	1200	\N	23.27	13	0	f	2026-05-26 04:48:07.858	2026-05-26 04:47:57.018621
38	bc4cb353-3660-4c74-aa80-ed806d44bad9	mobile	opera	android	424	946	\N	200.68	12	0	f	2026-05-26 19:32:32.644	2026-05-26 19:32:22.135211
39	87ea3f12-7a83-4432-8ddb-82d56645d06f	mobile	opera	android	424	946	\N	200.68	35	0	f	2026-05-26 21:02:44.833	2026-05-26 21:02:11.073766
40	c85957bd-a8cc-48f5-9e44-a685e114b616	mobile	opera	android	424	946	\N	200.68	8	0	t	2026-05-26 22:12:45.386	2026-05-26 22:12:39.388607
42	95f250bb-3f39-4316-ab3d-616b104ede25	mobile	opera	android	424	946	\N	200.68	8	0	t	2026-05-27 00:31:03.014	2026-05-27 00:30:56.518549
43	756fdd15-42d4-4fa0-9785-8891bfcf6dff	desktop	chrome	linux	1920	1080	\N	177.226	6	0	t	2026-05-27 15:48:32.243	2026-05-27 15:48:27.695372
45	b2ca4257-d533-45bb-aeb0-31fe9f3e8e8b	mobile	chrome	android	374	843	https://l.instagram.com/	187.188	5	2	t	2026-05-27 21:08:46.073	2026-05-27 21:08:42.06003
44	a5939083-a740-4c13-8465-09882f4f3740	desktop	chrome	macos	1920	1080	https://www.wbconstruccion.mx/	136.226	2770	100	f	2026-05-27 20:55:12.906	2026-05-27 20:09:02.904995
47	4a43d5b9-9677-4998-a01d-3e48af333b06	desktop	chrome	macos	1470	956	https://www.wbconstruccion.mx/	170.85	3331	100	f	2026-05-28 16:01:38.02	2026-05-28 15:06:08.522217
46	499a99a7-8b9f-46d2-bea9-98eb99880c20	mobile	chrome	android	374	843	https://l.instagram.com/	187.188	4253	62	f	2026-05-27 22:19:43.145	2026-05-27 21:08:49.25366
48	55b37c04-2433-4995-975a-31bb91dd3d5b	mobile	safari	ios	402	874	https://l.instagram.com/	131.178	9	87	f	2026-05-28 15:41:13.126	2026-05-28 15:41:05.988781
49	bd7a45b5-68a6-4988-a60c-311d370910c2	desktop	chrome	macos	1470	956	https://www.wbconstruccion.mx/	136.226	5938	100	f	2026-05-28 17:43:05.041	2026-05-28 16:04:07.341719
50	ba73f553-2466-4fa5-8f14-c3692bb3c75e	desktop	chrome	windows	1680	1050	\N	177.226	77	100	f	2026-05-28 16:48:02.497	2026-05-28 16:46:46.57772
51	dafa4aa4-5a12-494b-8aa9-94dfee579f9b	desktop	chrome	windows	1600	900	\N	177.226	64	100	f	2026-05-29 17:37:46.586	2026-05-29 17:36:44.078374
52	625a10a1-ba49-4a8f-9dd2-8d49e8cdd8c4	desktop	chrome	macos	1024	898	\N	149.88	5	0	t	2026-05-30 07:29:27.507	2026-05-30 07:29:24.214201
53	8ce55337-5a66-4bf7-9389-b5255e74995f	desktop	chrome	windows	16384	16384	\N	167.103	\N	0	t	\N	2026-06-02 12:30:58.914362
70	0f9192ea-8e6b-4d52-8ad8-ff901b3afa76	desktop	other	ios	440	956	http://m.facebook.com	66.220	32	0	f	2026-06-15 18:33:07.258	2026-06-15 18:32:36.971916
54	fcf51eae-af16-4ed7-9d51-f7d5e4e299e7	mobile	chrome	android	1024	1024	\N	35.88	7	0	t	2026-06-02 21:44:26.017	2026-06-02 21:44:19.639422
55	9cf08998-4a39-4ff0-adb7-1dee5a587577	desktop	chrome	macos	1024	898	\N	158.173	3	0	t	2026-06-05 02:15:26.215	2026-06-05 02:15:25.392481
56	9ed3497d-1e51-4efe-8584-f876f938ddcc	desktop	edge	windows	1536	864	https://www.bing.com/	201.132	51	100	f	2026-06-06 17:19:26.342	2026-06-06 17:18:37.003187
57	8a9fa824-1487-4bf7-9c28-a27ce46f2021	mobile	opera	android	424	946	\N	186.96	\N	0	t	\N	2026-06-08 17:18:20.04936
58	ad2d8916-3983-4a5a-878c-8fc14e68931e	mobile	opera	android	424	946	\N	186.96	3	0	t	2026-06-08 17:40:40.956	2026-06-08 17:40:39.405074
59	bfc9c046-97e8-4179-ad79-d0f37266fb2d	desktop	edge	windows	1920	1080	\N	186.96	7	0	t	2026-06-08 20:27:54.397	2026-06-08 20:27:47.874096
71	22a957f7-dd48-4529-9709-962ee7d549ee	mobile	safari	ios	428	926	https://l.instagram.com/	189.219	67	102	f	2026-06-16 21:27:37.25	2026-06-16 21:26:30.859286
60	9acf80f4-02b0-49c0-a4a3-d7fccd78e3a8	mobile	safari	ios	390	844	https://l.instagram.com/	189.153	18	61	f	2026-06-09 03:39:02.131	2026-06-09 03:38:45.868938
61	b2876ac6-7067-4fa0-8b34-f4726588f984	desktop	edge	windows	1280	720	\N	189.179	179	42	f	2026-06-09 21:52:01.796	2026-06-09 21:49:04.642544
72	99bf3899-e685-479b-89bf-87571acf907a	mobile	safari	ios	440	956	https://l.instagram.com/	201.162	438	101	f	2026-06-17 19:42:18.43	2026-06-17 19:34:58.78691
73	5ed73a8e-d07d-4629-98da-34562b6697d3	mobile	opera	android	424	946	\N	200.68	\N	0	t	\N	2026-06-18 13:36:52.971315
62	4ed63f7f-1518-4310-b0ac-80f969597294	desktop	edge	windows	1280	720	\N	189.179	2721	100	f	2026-06-09 22:34:26.005	2026-06-09 21:49:04.647657
63	dae5c103-742c-480a-a31b-d74c5b348106	desktop	firefox	linux	1600	900	\N	177.226	251	50	f	2026-06-10 18:33:37.236	2026-06-10 18:29:26.687413
74	98d08a0b-ba9f-4fd1-9ea3-b699084e732c	mobile	opera	android	424	946	\N	200.68	\N	0	t	\N	2026-06-18 18:45:27.348596
65	a9407178-a399-4955-af62-35b99288b209	mobile	safari	ios	393	852	https://l.instagram.com/	131.161	15	91	f	2026-06-10 21:47:23.102	2026-06-10 21:47:07.63052
64	ab829ceb-4de6-4e1d-b699-608dba9b1b75	desktop	chrome	windows	1536	864	\N	131.161	114	100	f	2026-06-10 21:47:34.814	2026-06-10 21:45:42.458164
66	7c86a6a4-012e-46b9-8950-6188c40c8850	mobile	safari	ios	428	926	https://l.instagram.com/	189.219	39	87	f	2026-06-11 18:14:39.428	2026-06-11 18:14:01.993262
75	12ce35cb-4a79-4322-99bb-ddcfb1901433	mobile	opera	android	424	946	\N	200.68	9	0	t	2026-06-19 15:36:02.08	2026-06-19 15:35:55.479648
76	c5a0ec9d-5795-485d-8968-d5b43d72c3d6	mobile	chrome	android	360	771	\N	200.63	338	100	f	2026-06-19 18:36:51.48	2026-06-19 18:31:14.694423
67	dc68f6a0-d088-4317-b51d-c84461fe5b99	desktop	chrome	windows	1536	864	\N	131.161	93	100	f	2026-06-12 20:49:57.424	2026-06-12 20:48:25.856399
68	3a3643e9-18f8-486f-82e6-d89ed817c4a8	mobile	safari	ios	428	926	\N	200.68	126	62	f	2026-06-13 00:44:33.658	2026-06-13 00:42:28.971369
69	af8ada9f-63e9-4c09-9f6c-9740330078ae	mobile	opera	android	424	946	\N	200.68	14	0	f	2026-06-15 18:22:02.169	2026-06-15 18:21:49.476333
77	dfe29d5a-be8f-4c7e-8216-a797af85aa4c	mobile	opera	android	424	946	\N	200.68	15	0	f	2026-06-20 19:37:08.128	2026-06-20 19:36:54.822758
78	1be07589-c2bc-4049-8f9c-448beb5b1bef	desktop	edge	windows	1980	1080	https://www.bing.com/	4.255	7	0	t	2026-06-21 21:53:30.11	2026-06-21 21:53:24.373232
79	96e4eb1d-084c-4df2-ae69-06353454ef7c	desktop	chrome	windows	1536	864	\N	131.161	4	0	t	2026-06-22 18:20:49.492	2026-06-22 18:20:46.525159
80	848f280f-6675-4c42-9854-e7d2b5be072c	mobile	opera	android	424	946	\N	186.96	6	0	t	2026-06-22 19:02:38.69	2026-06-22 19:02:32.844609
81	fa8d2cff-32b5-47d8-9b54-eb8c4095e9b0	desktop	chrome	windows	1536	864	\N	131.161	1541	100	f	2026-06-22 22:39:59.398	2026-06-22 22:14:19.140221
82	ef041999-ccdb-46e3-b05c-690795ad5e25	desktop	chrome	windows	1253	783	https://l.instagram.com/	189.158	146	78	f	2026-06-23 17:35:12.274	2026-06-23 17:32:48.101532
83	e7e17007-a443-4e6d-a157-a100e1bf7628	desktop	edge	windows	1920	1080	\N	189.248	200	100	f	2026-06-23 18:06:50.768	2026-06-23 18:03:32.512061
84	20395d61-988b-4ebd-bb21-d33e0c28c614	desktop	chrome	macos	800	600	\N	35.87	\N	0	t	\N	2026-06-23 18:07:33.106019
85	35714994-7fbd-4a03-81d8-ddaeb3483bb6	desktop	chrome	windows	1536	864	\N	131.161	1130	100	f	2026-06-23 19:30:01.744	2026-06-23 19:11:13.25177
86	a8477e3f-0630-4f32-aef8-619374845273	desktop	safari	macos	800	600	\N	34.86	9	0	t	2026-06-24 01:31:21.217	2026-06-24 01:31:13.878689
87	da128b7d-2a74-431b-a069-db79f1042fc6	desktop	chrome	windows	800	600	\N	54.71	\N	0	t	\N	2026-06-24 01:31:56.879946
88	8758ffeb-1cfe-4c7b-8dce-881c1b497d0c	desktop	chrome	linux	800	600	\N	34.123	\N	0	t	\N	2026-06-24 02:32:15.134769
89	00713158-ae6e-4ab7-97bb-66ec91c5deb7	desktop	chrome	linux	800	600	\N	34.72	\N	0	t	\N	2026-06-24 02:32:34.890682
90	11798bcb-a237-45fc-aabb-42c9f03958d4	desktop	chrome	windows	1920	1080	\N	82.24	\N	0	t	\N	2026-06-24 02:38:50.131424
91	015b6cee-613f-4db3-9818-0ac91a23d416	mobile	chrome	android	1600	1200	\N	205.169	\N	0	t	\N	2026-06-24 02:48:24.922307
92	9826f5ce-a242-4d6b-8827-8d522eeafc84	mobile	safari	ios	1600	1200	\N	205.169	\N	0	t	\N	2026-06-24 02:48:27.267068
93	a063ca75-de5e-47bd-be98-ddbc0d59c811	desktop	chrome	windows	800	600	https://bing.com/	205.169	\N	0	t	\N	2026-06-24 02:48:28.892116
94	06db6696-6aaf-412b-8bb8-bc290306ca25	desktop	chrome	windows	800	600	\N	205.169	\N	0	t	\N	2026-06-24 02:51:53.855669
95	1bfebdda-888b-4d45-a978-703de76014fd	mobile	safari	ios	390	844	\N	103.196	10	0	f	2026-06-24 03:47:44.326	2026-06-24 03:47:35.863708
96	142eb760-34bc-4e9e-8e83-ba125a32153f	mobile	safari	ios	390	844	\N	103.196	\N	0	t	\N	2026-06-24 03:48:29.487837
97	c4a63905-c2fd-4260-a832-68dae0a73a67	mobile	safari	ios	390	844	\N	103.196	16	0	f	2026-06-24 03:49:01.37	2026-06-24 03:48:45.746041
98	fdc7e6a9-fde7-4f59-be75-a414112429ce	mobile	safari	ios	390	844	\N	103.4	15	0	f	2026-06-24 03:49:19.844	2026-06-24 03:49:04.913787
99	04816253-bc96-49b6-8464-807a43569c03	mobile	safari	ios	390	844	\N	103.196	14	0	f	2026-06-24 03:49:39.838	2026-06-24 03:49:25.364751
100	6195db7e-3c33-4916-86a6-9d1992b5d5ef	mobile	chrome	android	384	832	https://l.instagram.com/	189.159	15	95	f	2026-06-24 08:16:44.834	2026-06-24 08:16:31.177157
101	aae36fea-dc88-4326-8373-bcc9e5018f9d	mobile	opera	android	424	946	\N	200.68	8	0	t	2026-06-24 13:07:33.935	2026-06-24 13:01:30.613097
102	5f3661e8-9f1d-44f3-9b0e-e81aed4f6f85	mobile	opera	android	424	946	\N	200.68	\N	0	t	\N	2026-06-24 13:36:20.42739
103	608b7879-6ffb-4349-9973-d9aa82033b7f	desktop	chrome	macos	1024	898	\N	187.190	6	0	t	2026-06-24 20:34:06.557	2026-06-24 20:34:01.886033
104	9390a9eb-1298-44b1-9a78-2c6d51dbcd95	mobile	opera	android	424	946	\N	200.68	5	0	t	2026-06-25 23:35:33.473	2026-06-25 23:35:29.508294
105	ddb0c034-7ab9-4697-9e56-bd92b0f11ff6	desktop	chrome	linux	1440	900	\N	202.5	8	0	t	2026-06-26 00:20:29.836	2026-06-26 00:20:23.003603
106	bcf0003c-0066-4383-b004-57578ddcf57a	desktop	chrome	linux	800	600	\N	34.122	\N	0	t	\N	2026-06-26 05:49:33.148738
107	2c57e25d-152b-4719-af73-30eb3812820a	mobile	opera	android	424	946	\N	200.68	8	0	t	2026-06-26 14:51:51.564	2026-06-26 14:51:45.582864
108	83e6407f-2414-41e8-bb59-225398fa8923	desktop	chrome	windows	800	600	\N	205.169	\N	0	t	\N	2026-06-26 18:08:32.827958
109	7fed6ed2-07ed-4c00-8ea9-c5f991d66dd0	mobile	opera	android	424	946	\N	200.68	4	0	t	2026-06-26 23:42:57.742	2026-06-26 23:42:55.604505
110	851a24a8-2219-40d3-9106-08f2b1d2076f	mobile	chrome	android	2000	2000	https://www.facebook.com/	173.252	23	0	f	2026-06-27 03:39:56.792	2026-06-27 03:39:34.913734
111	d68155f1-7f37-49e4-9a03-aecdf28a4061	mobile	opera	android	424	946	\N	200.68	25	0	f	2026-06-30 22:03:08.028	2026-06-30 22:02:44.813613
113	7fd19ac8-2bd4-4ba8-920f-9beea8f3825a	mobile	safari	ios	320	693	\N	190.123	1	0	t	2026-07-01 20:14:43.959	2026-07-01 20:14:42.686833
114	d90afbd2-077a-4ce4-bb1d-b8bd802e72e3	mobile	safari	ios	320	693	\N	190.123	2	0	t	2026-07-01 20:14:47.46	2026-07-01 20:14:45.825856
128	e9574846-1caa-48fa-adb0-666346088cfb	desktop	chrome	windows	1920	1080	https://www.wbconstruccion.mx/?fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGn2viOK1m-H-TEH1E8KWzUTqapxOwj25DaLpm57RID7AwH5kQleCfsVHHKaNQ_aem_YrSv0cpttPv3FESqeVX4_w&utm_content=link_in_bio&utm_medium=social&utm_source=ig	210.242	136	0	f	2026-07-07 06:48:45.982	2026-07-07 06:46:22.252536
112	b72e8c78-f826-4df6-a827-0b3279358944	mobile	safari	ios	320	693	https://l.instagram.com/	190.123	43	101	f	2026-07-01 20:14:59.272	2026-07-01 20:14:17.66829
117	b4e7d8dc-3f79-43b2-ad94-4ee644b428c5	desktop	chrome	windows	1920	1080	https://l.instagram.com/	210.242	83	0	f	2026-07-02 13:39:34.364	2026-07-02 13:38:12.634466
118	2c0d7bb2-132e-40f1-824a-3d040feadaf3	desktop	chrome	windows	1920	1080	https://www.wbconstruccion.mx/?fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGn2viOK1m-H-TEH1E8KWzUTqapxOwj25DaLpm57RID7AwH5kQleCfsVHHKaNQ_aem_YrSv0cpttPv3FESqeVX4_w&utm_content=link_in_bio&utm_medium=social&utm_source=ig	210.242	79	100	f	2026-07-02 13:39:34.891	2026-07-02 13:38:15.813405
115	2bffe295-87c2-4a55-a4f2-b1537695b7ef	mobile	safari	ios	320	693	https://l.instagram.com/	190.123	123	61	f	2026-07-01 23:18:01.96	2026-07-01 23:16:00.765688
116	d1456edf-6a1c-480b-a2e0-bf73234f2315	mobile	opera	android	424	946	\N	200.68	6	0	t	2026-07-02 13:13:21.037	2026-07-02 13:13:16.443837
120	36ba7d57-4cb9-4abb-8dfd-58722b30d571	desktop	chrome	windows	1920	1080	\N	210.242	6	0	t	2026-07-02 13:39:50.547	2026-07-02 13:39:44.107385
119	c0eb9250-0e6f-4f0c-904b-047bfcb7e576	desktop	chrome	windows	1920	1080	https://www.wbconstruccion.mx/?fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGn2viOK1m-H-TEH1E8KWzUTqapxOwj25DaLpm57RID7AwH5kQleCfsVHHKaNQ_aem_YrSv0cpttPv3FESqeVX4_w&utm_content=link_in_bio&utm_medium=social&utm_source=ig	210.242	1136	0	f	2026-07-02 13:58:29.448	2026-07-02 13:39:32.626104
121	3ff38ac1-7ba7-40ff-a43c-b1ee612c2899	mobile	opera	android	424	946	\N	200.68	5	0	t	2026-07-03 23:34:15.242	2026-07-03 23:34:11.841199
122	62679c4e-0074-477a-a092-0cc4a60d6e0b	desktop	chrome	linux	1920	890	\N	149.57	\N	0	t	\N	2026-07-04 19:14:20.862451
123	f3d71586-3374-4c91-a1d6-6f97f6c8306f	mobile	opera	android	424	946	\N	186.96	4	0	t	2026-07-04 20:11:26.457	2026-07-04 20:11:23.622321
124	782823ff-8806-46e0-b37b-331c3f1d45bd	desktop	chrome	windows	1489	838	\N	210.242	246	0	f	2026-07-06 10:31:09.975	2026-07-06 10:27:05.756804
127	397022c4-286a-4fe5-8437-f739543fd916	desktop	chrome	windows	1920	1080	\N	210.242	244	48	f	2026-07-07 06:47:28.946	2026-07-07 06:43:26.372203
132	97c6f4ae-8c9e-4dcb-b411-542d682bac55	desktop	chrome	linux	1680	1050	\N	45.174	9	0	t	2026-07-11 01:43:05.147	2026-07-11 01:42:57.806935
129	21b0d7a2-55cb-4f73-afc8-da6bdba36a7a	desktop	chrome	windows	1920	1080	\N	210.242	15	0	f	2026-07-07 06:49:03.409	2026-07-07 06:48:47.932481
125	91c6d542-b079-43cd-96ea-9c29dc540bfb	desktop	chrome	windows	1489	838	\N	210.242	206	100	f	2026-07-06 10:33:28.803	2026-07-06 10:30:02.609706
126	76e73ab7-ef25-4466-a65a-fd4922fb00f7	desktop	chrome	windows	1489	838	\N	210.242	4	0	t	2026-07-07 05:31:21.528	2026-07-07 05:31:18.989714
130	8bc9336a-6412-45fd-9504-251474fddfef	mobile	opera	android	424	946	\N	200.68	3	0	t	2026-07-10 13:30:55.668	2026-07-10 13:30:54.027915
131	5df44d88-60c0-4a26-9b14-78b559e14953	mobile	chrome	android	412	892	https://l.instagram.com/	201.175	92	93	f	2026-07-10 20:09:14.23	2026-07-10 20:07:43.145832
\.


--
-- Data for Name: archivos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.archivos (id, url, key, nombre, tipo, carga_id, subido_por_id, created_at) FROM stdin;
13	https://tqzap0oixm.ufs.sh/f/PRPEgqvT2Er5yG5bNF7YlAp1bejhx0M3FVZza7cRqitGTL9y	PRPEgqvT2Er5yG5bNF7YlAp1bejhx0M3FVZza7cRqitGTL9y	odometroFoto-2829	odometroFoto	2829	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:32:04.118492
14	https://tqzap0oixm.ufs.sh/f/PRPEgqvT2Er5y92LfA7YlAp1bejhx0M3FVZza7cRqitGTL9y	PRPEgqvT2Er5y92LfA7YlAp1bejhx0M3FVZza7cRqitGTL9y	odometroFoto-3268	odometroFoto	3268	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 14:02:12.920969
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_log (id, usuario_id, accion, entidad, entidad_id, datos_json, created_at) FROM stdin;
1	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	60:197	{"motivo":"update_carga","cargaId":2779,"cambios":{"fecha":"2026-05-07","hora":"09:07","folio":11595,"litros":50,"odometroHrs":21911,"cuentaLtInicio":5247,"cuentaLtFin":5295,"operadorId":240,"obraId":152,"notas":null}}	2026-05-15 17:07:41.192426
2	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	63:234	{"motivo":"update_carga","cargaId":2887,"cambios":{"fecha":"2026-05-13","hora":"15:20","folio":11835,"litros":240,"odometroHrs":3686.6,"cuentaLtInicio":914880,"cuentaLtFin":915130,"operadorId":271,"obraId":144,"notas":"No se lleno el tanque kedo ariva de 3/4"}}	2026-05-22 12:02:55.429842
3	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	63:234	{"motivo":"update_carga","cargaId":2887,"cambios":{"fecha":"2026-05-13","hora":"15:20","folio":11835,"litros":1,"odometroHrs":3686.6,"cuentaLtInicio":914880,"cuentaLtFin":915130,"operadorId":271,"obraId":144,"notas":"No se lleno el tanque kedo ariva de 3/4\\nSe retiran 260 litros el 22 de mayo , 100 al camion 12 directo en yogas , 160 se fueron a la nissan"}}	2026-05-22 12:04:57.679191
4	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	68:215	{"motivo":"update_carga","cargaId":3632,"cambios":{"fecha":"2026-06-15","folio":442650000,"litros":185,"odometroHrs":50432,"cuentaLtInicio":null,"cuentaLtFin":null,"operadorId":null,"obraId":null,"notas":"[OXXOGAS] SE RELLENAN 185 LITROS DE OXXOGAS, PREVIAMENTE HABIAMOS RETIRADO 200 LITROS DE ESTE CAMION  ( QUEDARON DE STOCK )"}}	2026-06-20 17:28:33.06604
5	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	68:215	{"motivo":"update_carga","cargaId":3632,"cambios":{"fecha":"2026-06-15","folio":442650000,"litros":185,"odometroHrs":null,"cuentaLtInicio":null,"cuentaLtFin":null,"operadorId":null,"obraId":null,"notas":"[OXXOGAS] SE RELLENAN 185 LITROS DE OXXOGAS, PREVIAMENTE HABIAMOS RETIRADO 200 LITROS DE ESTE CAMION  ( QUEDARON DE STOCK )"}}	2026-06-20 17:29:30.133274
6	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	68:242	{"motivo":"update_carga","cargaId":3627,"cambios":{"fecha":"2026-06-19","hora":"16:00","folio":13903,"litros":10,"odometroHrs":3537,"cuentaLtInicio":2625653,"cuentaLtFin":2625663,"operadorId":252,"obraId":null,"notas":"Kms 3537"}}	2026-06-24 00:45:10.50954
7	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	68:212	{"motivo":"update_carga","cargaId":3614,"cambios":{"fecha":"2026-06-19","hora":"09:55","folio":13899,"litros":100,"odometroHrs":0,"cuentaLtInicio":2624214,"cuentaLtFin":2624314,"operadorId":255,"obraId":null,"notas":null}}	2026-06-24 00:48:52.708802
8	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	69:226	{"motivo":"update_carga","cargaId":3776,"cambios":{"fecha":"2026-06-26","litros":1,"odometroHrs":59831,"cuentaLtInicio":null,"cuentaLtFin":null,"operadorId":null,"obraId":162,"notas":"[Externo]"}}	2026-06-27 17:55:41.047298
9	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	69:226	{"motivo":"update_carga","cargaId":3776,"cambios":{"fecha":"2026-06-26","litros":1,"odometroHrs":57831,"cuentaLtInicio":null,"cuentaLtFin":null,"operadorId":null,"obraId":162,"notas":"[Externo]"}}	2026-06-27 17:56:33.192239
10	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	71:203	{"motivo":"update_carga","cargaId":3803,"cambios":{"fecha":"2026-06-29","hora":"17:46","folio":12467,"litros":120,"odometroHrs":131831,"cuentaLtInicio":2639189,"cuentaLtFin":2639309,"operadorId":242,"obraId":null,"notas":"SE CAMBIA VALVULA REPARTIDORA DE AIRE\\n"}}	2026-07-04 20:45:11.290282
11	user_3BYiAC79vdFAXS59rbNLZhHcBlT	recalc_rendimiento	rendimiento	71:203	{"motivo":"update_carga","cargaId":3802,"cambios":{"fecha":"2026-06-29","hora":"17:46","folio":12467,"litros":120,"odometroHrs":131831,"cuentaLtInicio":2639189,"cuentaLtFin":2639309,"operadorId":250,"obraId":null,"notas":null}}	2026-07-04 20:45:53.821268
\.


--
-- Data for Name: cargas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cargas (id, fecha, hora, folio, periodo_id, unidad_id, operador_id, obra_id, fuente_id, tanque_id, litros, odometro_hrs, cuenta_lt_inicio, cuenta_lt_fin, origen, tipo_diesel, notas, registrado_por_id, created_at, quien_suministra_id, quien_recibe_id, km_estimado) FROM stdin;
2579	2026-04-27	15:05:00	11532	61	222	263	140	\N	\N	60	291	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2580	2026-04-27	14:57:00	11531	61	221	263	140	\N	\N	38	\N	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2581	2026-04-27	15:53:00	11533	61	220	277	139	\N	\N	123	\N	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2582	2026-04-28	14:01:00	11545	61	210	253	\N	\N	\N	22	148420	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2583	2026-04-27	10:00:00	13081	61	219	239	\N	\N	\N	20	\N	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2584	2026-04-28	10:00:00	13096	61	238	239	\N	\N	\N	44	5627	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2585	2026-04-27	10:30:00	13082	61	236	239	\N	\N	\N	29	1351	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2586	2026-04-27	11:33:00	11530	61	225	265	142	\N	\N	336	2560	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2587	2026-04-28	16:21:00	11544	61	234	271	144	\N	\N	310	3612	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2588	2026-04-27	09:35:00	11529	61	224	262	147	\N	\N	91	3767	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2589	2026-04-28	15:52:00	11543	61	230	270	144	\N	\N	331	4136	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2590	2026-04-28	13:09:00	11542	61	218	259	153	\N	\N	36	1428	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2591	2026-04-30	15:50:00	13475	61	213	256	\N	\N	\N	1	1.365264e+06	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2592	2026-04-29	17:11:00	11553	61	213	256	136	\N	\N	100	1.365106e+06	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2593	2026-04-27	16:16:00	13089	61	213	256	\N	\N	\N	100	1.364766e+06	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2594	2026-04-28	15:35:00	13100	61	213	256	\N	\N	\N	100	1.364957e+06	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2595	2026-04-25	13:15:00	13074	61	213	256	\N	\N	\N	100	1.364622e+06	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2597	2026-04-28	15:45:00	13451	61	205	247	\N	\N	\N	120	15119	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2598	2026-04-25	13:02:00	13073	61	205	247	\N	\N	\N	100	14721	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2599	2026-04-29	11:31:00	11548	61	197	240	152	\N	\N	100	11548	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2600	2026-04-28	08:52:00	11540	61	197	240	146	\N	\N	100	20279	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2601	2026-04-25	14:20:00	13077	61	197	240	\N	\N	\N	100	19985	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2602	2026-04-25	07:07:00	11527	61	197	240	137	\N	\N	100	19924	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2603	2026-04-01	\N	\N	62	213	242	\N	\N	\N	1	132695	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2604	2026-04-29	15:22:00	13471	61	199	242	\N	\N	\N	230	132465	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2605	2026-04-25	12:23:00	13071	61	199	242	\N	\N	\N	305	131855	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2606	2026-04-01	\N	1	62	203	272	\N	\N	\N	1	122878	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2607	2026-04-29	10:43:00	11546	61	203	272	152	\N	\N	100	122502	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2608	2026-04-25	11:49:00	13069	61	203	272	\N	\N	\N	277	121957	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2609	2026-04-01	\N	4	62	198	241	\N	\N	\N	1	76120	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2610	2026-04-29	16:10:00	11550	61	198	241	136	\N	\N	100	75930	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2611	2026-04-28	10:05:00	11541	61	198	241	146	\N	\N	100	75652	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2612	2026-04-25	10:15:00	13067	61	198	241	\N	\N	\N	150	75341	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2613	2026-04-01	\N	6	62	214	257	\N	\N	\N	1	60861	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2614	2026-04-28	16:08:00	13453	61	214	269	\N	\N	\N	200	60467	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2615	2026-04-25	10:35:00	13068	61	214	257	\N	\N	\N	100	60003	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2616	2026-04-30	16:48:00	13482	61	204	246	\N	\N	\N	120	438951	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2617	2026-04-29	16:29:00	11552	61	204	246	136	\N	\N	120	438747	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2618	2026-04-28	17:21:00	13459	61	204	246	\N	\N	\N	100	438568	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2619	2026-04-28	06:23:00	11536	61	204	246	137	\N	\N	120	438284	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2620	2026-04-30	17:20:00	13486	61	229	269	\N	\N	\N	150	785007	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2621	2026-04-28	06:32:00	11537	61	229	269	137	\N	\N	120	784420	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2622	2026-04-28	14:15:00	13098	61	229	269	\N	\N	\N	80	784571	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2623	2026-04-29	18:08:00	13488	61	228	268	\N	\N	\N	10	2060	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2624	2026-04-28	17:00:00	13458	61	228	268	\N	\N	\N	100	1712	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2625	2026-04-27	17:43:00	13091	61	228	268	\N	\N	\N	150	1516	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2626	2026-04-25	07:22:00	11528	61	228	268	137	\N	\N	100	1188	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2628	2026-04-28	17:54:00	13461	61	200	252	\N	\N	\N	100	638902	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2629	2026-04-27	18:05:00	13093	61	200	252	\N	\N	\N	120	638474	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2630	2026-04-25	14:47:00	13059	61	200	252	\N	\N	\N	100	637837	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2631	2026-04-25	12:45:00	13072	61	200	252	\N	\N	\N	50	638063	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2632	2026-04-30	16:20:00	13477	61	202	244	\N	\N	\N	5	62807	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2633	2026-04-29	14:42:00	13467	61	202	244	\N	\N	\N	100	62577	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2634	2026-04-28	16:29:00	13455	61	202	244	\N	\N	\N	100	62315	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2635	2026-04-27	13:50:00	13084	61	202	244	\N	\N	\N	100	62008	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2636	2026-04-25	17:24:00	13065	61	202	244	\N	\N	\N	150	61595	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2637	2026-04-30	15:00:00	13474	61	201	243	\N	\N	\N	20	11003	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2638	2026-04-28	06:40:00	11538	61	201	243	137	\N	\N	110	10453	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2639	2026-04-25	14:05:00	13076	61	201	243	\N	\N	\N	150	10190	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2640	2026-04-25	06:44:00	11526	61	201	243	137	\N	\N	100	10143	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2641	2026-04-01	\N	3	62	208	250	\N	\N	\N	1	1.028845e+06	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2642	2026-04-29	10:48:00	11547	61	208	250	152	\N	\N	100	1.0286e+06	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2643	2026-04-28	08:35:00	11539	61	208	250	146	\N	\N	100	1.028326e+06	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2644	2026-04-25	15:00:00	13080	61	208	250	\N	\N	\N	150	1.028103e+06	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2645	2026-04-30	17:30:00	13487	61	206	248	\N	\N	\N	45	512089	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2646	2026-04-29	15:10:00	13470	61	206	248	\N	\N	\N	50	511729	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2647	2026-04-28	16:20:00	13454	61	206	248	\N	\N	\N	80	511580	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2648	2026-04-27	15:15:00	13087	61	206	248	\N	\N	\N	100	511322	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2649	2026-04-25	14:27:00	13078	61	206	248	\N	\N	\N	150	511118	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2650	2026-04-30	16:25:00	13478	61	209	251	\N	\N	\N	1	38403	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2651	2026-04-29	15:37:00	13472	61	209	251	\N	\N	\N	90	38278	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2652	2026-04-28	16:40:00	13456	61	209	251	\N	\N	\N	100	38072	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2653	2026-04-27	14:05:00	13086	61	209	251	\N	\N	\N	20	37828	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2654	2026-04-25	15:45:00	13062	61	209	251	\N	\N	\N	100	37670	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2655	2026-04-25	14:35:00	13079	61	209	251	\N	\N	\N	80	37813	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2656	2026-05-02	05:05:00	13484	60	211	254	\N	\N	\N	100	30768	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2657	2026-04-30	16:58:00	13483	61	211	254	\N	\N	\N	1	30768	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2658	2026-04-29	14:04:00	13468	61	211	254	\N	\N	\N	80	30597	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2659	2026-04-27	15:35:00	13088	61	211	254	\N	\N	\N	100	30209	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2660	2026-04-28	14:20:00	13099	61	211	254	\N	\N	\N	120	30444	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2661	2026-04-25	14:15:00	13057	61	211	254	\N	\N	\N	120	29908	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2662	2026-04-30	16:06:00	13476	61	212	255	\N	\N	\N	5	42393	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2663	2026-04-29	15:04:00	13469	61	212	255	\N	\N	\N	150	42188	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2664	2026-04-27	14:00:00	13085	61	212	255	\N	\N	\N	100	41804	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2665	2026-04-25	06:34:00	11525	61	212	255	137	\N	\N	100	41694	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2666	2026-04-29	13:30:00	13463	61	232	266	\N	\N	\N	90	474812	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2667	2026-04-28	06:06:00	11534	61	232	266	137	\N	\N	99	474493	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2668	2026-04-25	06:25:00	11523	61	232	266	137	\N	\N	80	474193	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2669	2026-04-30	18:15:00	13489	61	207	249	\N	\N	\N	5	483351	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2670	2026-04-29	13:48:00	13465	61	207	249	\N	\N	\N	100	483151	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2671	2026-04-28	16:50:00	13457	61	207	249	\N	\N	\N	80	483004	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2672	2026-04-27	12:00:00	13083	61	207	249	\N	\N	\N	50	482376	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2673	2026-04-27	18:16:00	13094	61	207	249	\N	\N	\N	70	482777	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2674	2026-04-25	06:30:00	11524	61	207	249	137	\N	\N	80	482478	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2675	2026-04-30	16:30:00	13481	61	227	267	\N	\N	\N	5	449226	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2676	2026-04-29	16:23:00	11551	61	227	267	136	\N	\N	80	449020	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2677	2026-04-28	15:55:00	13452	61	227	267	\N	\N	\N	100	448851	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2678	2026-04-27	17:35:00	13090	61	227	267	\N	\N	\N	100	448638	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2679	2026-04-25	16:00:00	13064	61	227	267	\N	\N	\N	150	448187	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2680	2026-04-01	\N	7	62	215	258	\N	\N	\N	1	42378	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2681	2026-04-29	13:38:00	13464	61	215	258	\N	\N	\N	150	42083	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2682	2026-04-28	06:42:00	11535	61	215	258	137	\N	\N	60	41755	\N	\N	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2683	2026-04-25	11:55:00	13070	61	215	258	\N	\N	\N	122	41519	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2684	2026-04-30	17:15:00	13485	61	237	276	\N	\N	\N	20	371209	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2685	2026-04-29	07:50:00	13462	61	237	276	\N	\N	\N	63	370854	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2686	2026-04-27	17:52:00	13092	61	237	276	\N	\N	\N	148	3.705711e+06	\N	\N	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 00:49:36.163163	\N	\N	f
2687	2026-04-30	09:08:00	11554	61	225	265	142	30	16	345	2582	0	345	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:08:55.432255	\N	265	f
2688	2026-04-30	10:30:00	11555	61	205	247	\N	30	16	100	15413	600	700	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:13:06.790495	\N	247	f
2689	2026-04-30	16:58:00	13480	61	205	247	\N	29	15	6	15512	2.542309e+06	2.542315e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:14:28.608773	\N	\N	f
2690	2026-04-30	12:05:00	11556	61	200	252	146	30	16	100	639331	700	800	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:17:40.330125	\N	252	f
2691	2026-04-30	16:26:00	13479	61	200	252	\N	29	15	5	639474	2.542304e+06	2.542309e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:19:04.102337	\N	\N	f
2692	2026-04-30	14:15:00	11557	61	216	259	138	30	16	91	5187	800	891	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:19:47.479856	\N	259	f
2693	2026-04-30	15:10:00	11558	61	235	274	150	30	16	27	\N	891	918	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:20:19.095804	\N	274	f
2694	2026-04-30	15:17:00	11559	61	239	274	150	30	16	70	\N	918	988	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:20:53.521357	\N	274	f
2696	2026-05-01	12:00:00	2	61	199	242	\N	30	16	1	132695	1097	1098	campo	normal	NOTA CORTE KMS	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:27:03.461401	\N	242	f
2695	2026-04-30	17:24:00	11560	61	233	264	141	30	16	109	\N	988	1097	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:21:24.817824	\N	264	f
2697	2026-05-01	21:29:00	5	61	197	240	\N	30	16	1	11869	1098	1099	campo	normal	NOTA PARA CERRAR SEMANA GPS	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:30:55.633824	\N	240	f
2698	2026-05-02	07:18:00	11561	60	197	240	\N	30	16	100	11869	1099	1199	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-02 13:30:30.772914	253	240	t
2699	2026-05-02	08:46:00	11562	60	209	251	142	30	16	100	38463	1199	1299	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-02 17:06:36.057499	253	251	f
2700	2026-05-02	12:41:00	11563	60	201	243	137	30	16	100	11046	1299	1399	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-02 18:43:14.364755	253	243	f
2701	2026-05-02	13:42:00	13491	60	228	268	\N	29	15	150	2148	2.543768e+06	2.543918e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 20:43:07.171635	\N	\N	f
2702	2026-05-02	13:10:00	13493	60	199	242	\N	29	15	130	132695	2.543918e+06	2.544048e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 20:44:04.999021	\N	\N	t
2703	2026-05-02	13:16:00	13494	60	203	272	\N	29	15	282	122878	2.544048e+06	2.54433e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 20:47:32.045045	\N	\N	t
2704	2026-05-02	13:35:00	13495	60	200	252	\N	29	15	100	639474	2.544331e+06	2.544431e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 20:48:09.981902	\N	\N	t
2705	2026-05-02	13:47:00	13496	60	202	244	\N	29	15	118.5	62894	2.544431e+06	2.5445495e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 21:01:48.456344	\N	\N	f
2706	2026-05-02	13:57:00	13497	60	226	266	\N	29	15	240	47909	2.544551e+06	2.544791e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 21:02:59.820703	\N	\N	f
2707	2026-05-02	14:11:00	13498	60	197	240	\N	29	15	100	11968	2.544791e+06	2.544891e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 21:03:57.635355	\N	\N	f
2708	2026-05-02	14:18:00	13499	60	227	267	\N	29	15	120	449288	2.544891e+06	2.545011e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 21:04:24.900175	\N	\N	f
2709	2026-05-02	14:28:00	13500	60	212	273	\N	29	15	100	42468	2.545012e+06	2.545112e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 21:04:52.765409	\N	\N	f
2710	2026-05-02	14:35:00	13151	60	213	256	\N	29	15	102	1.365342e+06	2.545112e+06	2.545214e+06	patio	normal	Iniciar el lunes con prueba de rendimiento 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 22:36:11.842086	\N	\N	f
2711	2026-05-02	14:45:00	13152	60	214	257	\N	29	15	200	61070	2.545214e+06	2.545414e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 22:37:08.00618	\N	\N	f
2712	2026-05-02	14:57:00	13153	60	201	243	\N	29	15	150	11077	2.545414e+06	2.545564e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 22:38:08.406616	\N	\N	f
2713	2026-05-02	15:10:00	13154	60	206	248	\N	29	15	150	512089	2.545565e+06	2.545715e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 22:38:46.735127	\N	\N	t
2714	2026-05-02	17:20:00	13155	60	229	269	\N	29	15	100	785164	2.545715e+06	2.545815e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 22:40:54.999359	\N	\N	f
2717	2026-05-02	15:39:00	13157	60	198	241	\N	29	15	150	76298	2.545876e+06	2.546026e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 22:43:30.333206	\N	\N	f
2716	2026-05-02	15:30:00	13156	60	205	247	\N	29	15	60	15598	2.545815e+06	2.545875e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 22:42:43.086609	\N	\N	f
2718	2026-05-02	16:44:00	11565	60	237	276	136	30	16	100	371209	1399	1499	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-02 22:46:57.179228	253	276	t
2719	2026-05-04	08:12:00	11566	60	234	271	144	30	16	308	3612	1499	1807	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-04 14:13:59.818024	253	271	t
2720	2026-05-04	08:14:00	11567	60	230	262	144	30	16	275	4154	1807	2082	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-04 14:47:32.760541	253	262	f
2721	2026-05-04	13:03:00	11568	60	225	265	142	30	16	230	2598	2082	2312	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-04 19:05:41.485161	253	265	f
2722	2026-05-04	11:25:00	13158	60	237	276	\N	29	15	75	371546	2.546026e+06	2.546101e+06	patio	normal	Tanque lleno, movimientos 50d y r03	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-04 23:04:22.671848	\N	\N	f
2723	2026-05-04	16:03:00	13160	60	209	251	\N	29	15	100	38600	2.54725e+06	2.54735e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-04 23:33:19.111644	\N	\N	f
2724	2026-05-04	16:37:00	13161	60	211	254	\N	29	15	100	31040	2.547351e+06	2.547451e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-04 23:36:04.957816	\N	\N	f
2725	2026-05-04	17:06:00	13162	60	206	248	\N	29	15	120	512553	2.547451e+06	2.547571e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-04 23:37:32.357212	\N	\N	f
2726	2026-05-04	17:32:00	13163	60	204	246	\N	29	15	100	439266	2.547571e+06	2.547671e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-04 23:42:12.683431	\N	\N	f
2727	2026-05-05	18:37:00	11569	60	221	257	139	30	16	44	\N	2312	2356	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 00:41:23.568506	253	257	f
2728	2026-05-05	20:42:00	11570	60	216	259	138	30	16	90	5202	2356	2446	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 02:46:54.581235	253	259	f
2729	2026-05-05	06:33:00	11571	60	202	244	137	30	16	100	63138	2446	2546	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 12:36:04.783902	253	244	f
2730	2026-05-05	06:36:00	11572	60	201	243	137	30	16	100	11217	2546	2646	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 12:44:19.999615	253	243	f
2731	2026-05-05	06:44:00	11573	60	215	258	137	30	16	100	42556	2646	2746	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 12:55:11.199989	253	258	f
2732	2026-05-05	06:55:00	11574	60	227	267	137	30	16	100	449550	2746	2846	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 13:07:12.7727	253	267	f
2733	2026-05-05	07:14:00	11575	60	229	269	137	30	16	100	785406	2846	2946	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 13:15:50.224689	253	269	f
2734	2026-05-05	07:15:00	11576	60	212	273	137	30	16	100	42695	2946	3046	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 13:23:55.977392	253	273	f
2735	2026-05-05	07:30:00	11577	60	205	247	137	30	16	100	15829	3046	3146	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 13:34:42.85053	253	247	f
2736	2026-05-05	07:40:00	11578	60	232	\N	143	30	16	100	475316	3146	3246	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 14:10:22.797307	253	\N	f
2737	2026-05-05	08:10:00	11579	60	197	240	143	30	16	100	11968	3246	3346	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 14:59:41.039417	253	240	t
2738	2026-05-05	08:59:00	11580	60	198	241	\N	30	16	50	76668	3346	3396	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 15:04:26.006668	253	241	f
2739	2026-05-04	17:42:00	13164	60	228	268	\N	29	15	100	2410	2.547671e+06	2.547771e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-05 16:26:46.643749	\N	\N	f
2740	2026-05-05	08:15:00	13165	60	213	256	\N	29	15	115	1.365558e+06	2.547772e+06	2.547887e+06	patio	normal	en prueba de rendimiento, carga 2	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-05 16:28:10.548479	\N	\N	f
2741	2026-05-05	14:15:00	13167	60	229	269	\N	29	15	50	785579	2.548997e+06	2.549047e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-05 20:15:59.114745	\N	\N	f
2742	2026-05-05	14:25:00	11581	60	225	265	142	30	16	243	2607.7	3396	3639	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-05 20:33:37.309972	253	265	f
2743	2026-05-05	14:20:00	13168	60	211	254	\N	29	15	170	31040	2.549047e+06	2.549217e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-05 21:10:13.729175	\N	\N	t
2744	2026-05-05	14:42:00	13169	60	200	252	\N	29	15	100	640293	2.549218e+06	2.549318e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-05 21:12:10.023105	\N	\N	f
2745	2026-05-05	14:55:00	13170	60	207	276	\N	29	15	130	483421	2.549318e+06	2.549448e+06	patio	normal	Primera carga de angel Castañeda 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-05 21:13:18.09185	\N	\N	f
2746	2026-05-05	15:14:00	13171	60	214	257	\N	29	15	200	61070	2.549449e+06	2.549649e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-05 21:22:54.898951	\N	\N	t
2747	2026-05-05	15:25:00	13172	60	226	266	\N	29	15	192	47909	2.549649e+06	2.549841e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-05 21:55:41.269446	\N	\N	t
2748	2026-05-05	15:35:00	13173	60	205	247	\N	29	15	100	16033	2.549841e+06	2.549941e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-05 21:56:17.77934	\N	\N	f
2749	2026-05-06	16:00:00	13174	60	209	251	\N	29	15	100	38876	2.549942e+06	2.550042e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 01:18:26.049027	\N	\N	f
2750	2026-05-06	17:15:00	13175	60	206	248	\N	29	15	120	512885	2.550042e+06	2.550162e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 01:22:40.550843	\N	\N	f
2751	2026-05-06	17:30:00	13176	60	213	256	\N	29	15	90	1.365775e+06	2.550162e+06	2.550252e+06	patio	normal	En prueba de rendimiento carga 3	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 01:24:42.125136	\N	\N	f
2752	2026-05-06	18:00:00	13177	60	227	267	\N	29	15	80	449818	2.550253e+06	2.550333e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 01:26:03.871904	\N	\N	f
2753	2026-05-06	18:10:00	13178	60	204	246	\N	29	15	140	439552	2.550333e+06	2.550473e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 01:26:43.238914	\N	\N	f
2754	2026-05-06	19:43:00	11582	60	228	268	\N	30	16	100	2655	3639	3739	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-06 01:45:50.176363	253	268	f
2755	2026-05-06	06:04:00	11583	60	198	241	148	30	16	100	76777	3739	3839	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-06 12:06:15.816382	253	241	f
2756	2026-05-06	06:04:00	11583	60	198	241	148	30	16	100	76777	3839	3939	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-06 12:06:18.345635	253	241	f
2757	2026-05-06	06:06:00	11584	60	202	244	137	30	16	100	63383	3939	4039	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-06 13:21:26.332006	253	244	f
2758	2026-05-06	07:21:00	11585	60	212	273	137	30	16	100	42938	4039	4139	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-06 13:35:49.117039	253	273	f
2759	2026-05-06	07:25:00	13180	60	215	258	\N	29	15	169	42556	2.550717e+06	2.550886e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 13:47:17.176753	\N	\N	t
2760	2026-05-06	09:48:00	11586	60	232	250	137	30	16	100	475556	4139	4239	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-06 15:50:06.392032	253	250	f
2761	2026-05-06	12:10:00	11587	60	197	240	\N	30	16	100	11969	4239	4339	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 19:08:51.683324	239	240	f
2762	2026-05-06	13:06:00	11588	60	203	272	\N	30	16	100	123785	4339	4439	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-06 19:11:35.456859	253	272	f
2763	2026-05-06	13:13:00	11589	60	199	242	\N	30	16	232	133528	4439	4655	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-06 19:19:20.34114	253	242	f
2764	2026-05-06	07:40:00	13181	60	201	243	\N	29	15	150	11532	2.550886e+06	2.551036e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 23:14:34.958525	\N	\N	f
2765	2026-05-06	12:00:00	13182	60	240	239	\N	29	15	149	\N	2.551037e+06	2.551186e+06	patio	normal	patio menchaca	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 23:15:10.974317	\N	\N	f
2766	2026-05-06	13:40:00	13183	60	227	267	\N	29	15	60	449970	2.551187e+06	2.551247e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 23:15:57.754973	\N	\N	f
2767	2026-05-06	17:05:00	13185	60	213	256	\N	29	15	99.5	1.365976e+06	2.552307e+06	2.5524065e+06	patio	normal	prueba dia final	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-06 23:18:06.455759	\N	\N	f
2769	2026-05-07	06:31:00	11591	60	229	269	137	30	16	100	785902	4897	4997	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-07 12:35:05.356444	253	269	f
2770	2026-05-07	06:35:00	11592	60	202	244	137	30	16	50	63561	4997	5047	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-07 12:41:38.314257	253	244	f
2771	2026-05-07	06:41:00	11593	60	204	246	137	30	16	100	439784	5047	5147	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-07 12:46:40.411908	253	246	f
2772	2026-05-06	17:14:00	13186	60	206	248	\N	29	15	100	513156	2.552412e+06	2.552512e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 13:45:04.937077	\N	\N	f
2773	2026-05-06	17:25:00	13187	60	211	254	\N	29	15	80	31486	2.552512e+06	2.552592e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 13:45:33.778808	\N	\N	f
2774	2026-05-06	17:35:00	13188	60	200	252	\N	29	15	100	640728	2.552592e+06	2.552692e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 13:46:54.507171	\N	\N	f
2775	2026-05-06	18:45:00	13188	60	209	251	\N	29	15	100	39184	2.552691e+06	2.552791e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 13:47:28.340206	\N	\N	f
2776	2026-05-06	19:20:00	13188	60	207	276	\N	29	15	100	483778	2.55279e+06	2.55289e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 13:48:13.359127	\N	\N	f
2777	2026-05-06	20:00:00	13191	60	230	239	\N	29	15	200	4179	2.552893e+06	2.553093e+06	patio	normal	ENVIO DE CARGA EN HILUX, MAGO NO LOGRÓ CARGAR MAQUINARIA POR TEMAS DE ACCESO A OBRA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 13:50:22.36822	\N	\N	f
2768	2026-05-06	06:24:00	11590	60	234	271	144	30	16	242	3650.3	4655	4897	campo	normal	Se dejo grasa para martillo y grasa para chasis	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-07 12:31:34.250846	\N	\N	f
2778	2026-05-07	08:07:00	11594	60	232	250	152	30	16	100	475685	5147	5247	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-07 14:09:24.80068	253	250	f
2781	2026-05-07	12:40:00	13193	60	218	239	\N	29	15	15	1435	2.553134e+06	2.553149e+06	patio	normal	SALE A OBRA SAN PEDRO, MANTENIMIENTO REALIZADO A LOS 1432 HORAS	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 20:13:20.347699	\N	\N	f
2780	2026-05-07	23:20:00	13192	60	233	264	\N	29	15	40	1370	2.553094e+06	2.553134e+06	patio	normal	SE MANDAN 40 LITROS A OBRA DE MARAVILLAS, GARCIA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 20:11:57.429576	\N	\N	f
2783	2026-05-07	14:30:00	11597	60	233	264	\N	30	16	61	1374.3	5373	5434	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-07 20:33:09.544592	253	264	f
2782	2026-05-07	14:21:00	11596	60	220	253	154	30	16	78	19051	5295	5373	campo	normal	Planta verdEEE	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-07 20:27:36.544971	253	253	f
2784	2026-05-07	14:40:00	13194	60	214	257	\N	29	15	100	61923	2.553149e+06	2.553249e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 21:50:50.449457	\N	\N	f
2785	2026-05-07	14:50:00	13195	60	229	269	\N	29	15	100	786006	2.553249e+06	2.553349e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 21:51:17.19215	\N	\N	f
2786	2026-05-07	15:06:00	13196	60	226	266	\N	29	15	80	48929	2.553349e+06	2.553429e+06	patio	normal	1 BOTE DE UREA 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 21:51:53.627837	\N	\N	f
2787	2026-05-07	15:06:00	13196	60	226	266	\N	29	15	80	48929	2.553429e+06	2.553509e+06	patio	normal	1 BOTE DE UREA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 21:52:46.923032	\N	\N	f
2788	2026-05-07	15:12:00	13197	60	206	248	\N	29	15	70	513300	2.553429e+06	2.553499e+06	patio	normal	SE CAMBIA LLANTA POSICION #7 POR GALLO EN TALLER  295/80 R22	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 21:53:46.729543	\N	\N	f
2789	2026-05-07	15:52:00	11598	60	227	267	136	30	16	80	450197	5434	5514	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-07 21:54:28.401368	253	267	f
2790	2026-05-07	15:20:00	13198	60	205	247	\N	29	15	100	16366	2.5535e+06	2.5536e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 21:54:30.319992	\N	\N	f
2791	2026-05-07	15:54:00	11599	60	215	271	136	30	16	142	43212	5514	5656	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-07 22:03:40.362953	253	271	f
2792	2026-05-07	16:16:00	13199	60	200	252	\N	29	15	100	641093	2.5536e+06	2.5537e+06	patio	normal	ULTIMA CARGA DE MALDONADO EN EL 23, SE PASA AL 20	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 22:57:12.941669	\N	\N	f
2793	2026-05-07	16:40:00	131200	60	242	252	\N	29	15	130	44614	2.5537e+06	2.55383e+06	patio	normal	SE ACTIVA CAMION DESPUES DE REPARACION DE CHOQUE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 23:00:16.410131	\N	\N	f
2795	2026-05-08	06:40:00	11800	60	202	244	137	30	16	40	63720	5657	5697	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-08 12:42:27.746871	253	244	t
2796	2026-05-08	06:42:00	11801	60	201	243	137	30	16	40	11957	5697	5737	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-08 12:58:47.795079	253	243	f
2797	2026-05-08	06:58:00	11802	60	216	253	138	30	16	43	5219	57379	57422	campo	normal	Finalizo carga 43 litrs  tanque bacio	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-08 14:38:00.79187	253	253	f
2798	2026-05-07	17:50:00	13101	60	212	255	\N	29	15	150	43340	2.553831e+06	2.553981e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-08 21:50:32.626148	\N	\N	f
2799	2026-05-07	18:05:00	13102	60	209	251	\N	29	15	100	39449	2.553981e+06	2.554081e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-08 21:51:16.366284	\N	\N	f
2800	2026-05-07	18:44:00	13103	60	211	254	\N	29	15	80	31696	2.554078e+06	2.554158e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-08 21:52:10.274721	\N	\N	f
2801	2026-05-08	15:10:00	13107	60	229	269	\N	29	15	75	786175	2.555312e+06	2.555387e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-08 21:55:35.872752	\N	\N	f
2802	2026-05-08	15:20:00	13108	60	204	246	\N	29	15	110	440032	2.555387e+06	2.555497e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-08 23:01:55.189155	\N	\N	f
2803	2026-05-08	15:35:00	13109	60	207	276	\N	29	15	10	483974	2.555497e+06	2.555507e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-08 23:02:33.494495	\N	\N	f
2804	2026-05-09	18:57:00	11804	63	230	262	144	30	16	315	4194	911000	911315	campo	normal	Se relleno hidraulico	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-09 01:02:25.844225	253	262	f
2805	2026-05-09	09:20:00	11805	63	244	253	\N	30	16	42	150391	911315	911357	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 15:20:59.329589	\N	253	f
2806	2026-05-09	07:40:00	11806	63	198	241	148	30	16	100	77080	911315	911415	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-09 15:26:42.188088	253	241	f
2807	2026-05-09	09:26:00	11807	63	201	243	137	30	16	100	12369	911415	911515	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-09 15:28:21.269321	253	243	f
2808	2026-05-08	17:00:00	100	60	227	267	\N	29	15	1	450306	2.555507e+06	2.555508e+06	patio	normal	corte sin carga	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:03:55.871654	\N	\N	f
2809	2026-05-08	17:03:00	101	60	232	250	\N	29	15	1	475991	2.555508e+06	2.555509e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:06:34.815527	\N	\N	f
2810	2026-05-09	17:06:00	102	63	203	272	\N	29	15	1	124146	2.555509e+06	2.55551e+06	patio	normal	CORTE SIN CARGA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:07:18.938732	\N	\N	f
2811	2026-05-08	17:07:00	103	60	199	242	\N	29	15	1	133952	2.55551e+06	2.555511e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:14:38.863667	\N	\N	f
2812	2026-05-08	10:14:00	104	60	209	251	\N	29	15	1	39518	2.555511e+06	2.555512e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:15:16.543774	\N	\N	f
2813	2026-05-08	17:15:00	105	60	211	254	\N	29	15	1	31732	2.555512e+06	2.555513e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:15:59.82943	\N	\N	f
2814	2026-05-08	17:15:00	106	60	202	244	\N	29	15	1	63804	2.555513e+06	2.555514e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:16:21.159482	\N	\N	f
2815	2026-05-08	17:16:00	107	60	214	257	\N	29	15	1	62144	2.555514e+06	2.555515e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:17:00.426427	\N	\N	f
2816	2026-05-08	17:17:00	108	60	215	258	\N	29	15	1	43338	2.555515e+06	2.555516e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:18:15.558697	\N	\N	f
2817	2026-05-08	17:19:00	109	60	226	266	\N	29	15	1	49017	2.555516e+06	2.555517e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:20:28.658614	\N	\N	f
2818	2026-05-08	17:20:00	110	60	206	248	\N	29	15	1	513565	2.555517e+06	2.555518e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:31:02.01729	\N	\N	f
2819	2026-05-08	17:32:00	111	60	198	241	\N	29	15	1	77080	2.555518e+06	2.555519e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:33:09.407168	\N	\N	f
2820	2026-05-08	17:33:00	112	60	205	247	\N	29	15	1	16426	2.555519e+06	2.55552e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:33:40.61796	\N	\N	f
2821	2026-05-09	10:33:00	113	63	213	256	\N	29	15	1	1.366059e+06	2.55552e+06	2.555521e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:34:05.139814	\N	\N	f
2822	2026-05-08	10:34:00	114	60	201	243	\N	29	15	1	12369	2.555521e+06	2.555522e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:34:55.027369	\N	\N	f
2823	2026-05-09	11:57:00	11808	63	221	257	140	30	16	32	\N	911515	911547	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-09 18:01:50.147226	253	257	f
2824	2026-05-09	12:54:00	13111	63	207	276	\N	29	15	120	483985	2.555512e+06	2.555632e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:21:12.107949	\N	\N	f
2825	2026-05-09	13:05:00	13112	63	226	266	\N	29	15	100	49159	2.555632e+06	2.555732e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:22:12.038285	\N	\N	f
2826	2026-05-09	13:11:00	13113	63	203	272	\N	29	15	150	124146	2.555733e+06	2.555883e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:22:56.825548	\N	\N	t
2827	2026-05-09	13:20:00	13114	63	214	257	\N	29	15	100	62394	2.555883e+06	2.555983e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:23:57.475022	\N	\N	f
2828	2026-05-09	13:25:00	13115	63	202	244	\N	29	15	100	64056	2.555983e+06	2.556083e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:26:10.756933	\N	\N	f
2830	2026-05-09	13:43:00	13117	63	200	268	\N	29	15	100	641093	2.556183e+06	2.556283e+06	patio	normal	Pendiente hubodometro 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:32:58.14552	\N	\N	t
2831	2026-05-09	13:56:00	13118	63	206	248	\N	29	15	120	513751	2.556284e+06	2.556404e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:34:40.291777	\N	\N	f
2832	2026-05-09	14:12:00	13119	63	232	250	\N	29	15	150	476127	2.556404e+06	2.556554e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:35:20.955881	\N	\N	f
2833	2026-05-09	14:10:00	13120	63	215	258	\N	29	15	100	43338	2.556554e+06	2.556654e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:35:58.654161	\N	\N	t
2834	2026-05-09	14:31:00	13121	63	211	254	\N	29	15	130	31890	2.556654e+06	2.556784e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:37:53.486991	\N	\N	f
2835	2026-05-09	14:45:00	13122	63	229	269	\N	29	15	100	786175	2.556785e+06	2.556885e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:38:27.185173	\N	\N	t
2836	2026-05-09	15:00:00	13123	63	212	255	\N	29	15	100	43529	2.556885e+06	2.556985e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:39:07.679827	\N	\N	f
2837	2026-05-11	06:44:00	11809	63	234	271	144	30	16	237	3664	911547	911784	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 14:04:24.856569	253	271	f
2838	2026-05-11	10:20:00	11811	63	225	270	142	30	16	197	2632	911926	912123	campo	normal	No se llenó	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-11 16:37:53.345427	\N	270	f
2841	2026-05-09	15:45:00	13126	63	227	267	\N	29	15	118.5	450478	2.557165e+06	2.5572835e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-11 16:43:51.345026	\N	\N	f
2839	2026-05-09	15:13:00	13124	63	209	251	\N	29	15	100	39638	2.556985e+06	2.557085e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-11 16:42:46.471382	\N	\N	f
2840	2026-05-09	15:28:00	13125	63	205	247	\N	29	15	80	16569	2.557085e+06	2.557165e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-11 16:43:13.697341	\N	\N	f
2842	2026-05-11	13:15:00	11812	63	199	242	143	30	16	260	134178	2.558437e+06	2.558697e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 19:17:55.273163	253	242	f
2843	2026-05-11	14:29:00	11813	63	198	241	143	30	16	100	77229	2.558697e+06	2.558797e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 20:31:19.149029	253	241	f
2844	2026-05-11	14:31:00	11814	63	201	243	143	30	16	100	12610	2.558797e+06	2.558897e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 20:33:22.951859	253	243	f
2845	2026-05-11	14:33:00	11815	63	242	252	143	30	16	100	44723	2.558897e+06	2.558997e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 20:35:13.313655	253	252	f
2846	2026-05-11	14:35:00	11816	63	204	246	143	30	16	100	440360	2.558997e+06	2.559097e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 20:36:43.677318	253	246	f
2847	2026-05-11	14:36:00	11817	63	214	257	143	30	16	100	62499	2.559097e+06	2.559197e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 20:38:43.714491	253	257	f
2850	2026-05-11	14:41:00	11820	63	202	244	143	30	16	100	64173	2.559367e+06	2.559467e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 20:42:27.14823	253	244	f
2848	2026-05-11	14:38:00	11818	63	200	268	143	30	16	70	641500	2.559197e+06	2.559267e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 20:39:54.535926	253	268	f
2849	2026-05-11	14:39:00	11819	63	226	266	143	30	16	100	49375	2.559267e+06	2.559367e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 20:41:09.634428	253	266	f
2851	2026-05-11	16:46:00	11821	63	216	259	138	30	16	54	5222	2.559467e+06	2.559521e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 22:48:07.791392	253	259	f
2852	2026-05-11	16:48:00	11822	63	219	259	138	30	16	24	2745	2.559521e+06	2.559545e+06	campo	normal	No se lleno tanque  tanque de nissan finalizo carga	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-11 23:12:05.893656	253	259	f
2853	2026-05-11	16:38:00	13128	63	213	256	\N	29	15	150	1.366361e+06	2.558437e+06	2.558587e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-12 00:06:57.070192	\N	\N	f
2854	2026-05-11	16:45:00	13129	63	227	267	\N	29	15	100	450743	2.558587e+06	2.558687e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-12 00:07:28.582595	\N	\N	f
2855	2026-05-11	16:56:00	13130	63	215	258	\N	29	15	111	43778	2.558687e+06	2.558798e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-12 00:07:52.849961	\N	\N	f
2856	2026-05-11	17:10:00	13131	63	206	248	\N	29	15	100	513941	2.558798e+06	2.558898e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-12 00:08:19.067308	\N	\N	f
2857	2026-05-11	17:18:00	13132	63	211	254	\N	29	15	100	32055	2.558897e+06	2.558997e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-12 14:21:21.615908	\N	\N	f
2858	2026-05-11	17:35:00	13133	63	212	255	\N	29	15	100	43689	2.558997e+06	2.559097e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-12 14:21:53.915725	\N	\N	f
2859	2026-05-11	17:45:00	13134	63	209	251	\N	29	15	100	39840	2.559095e+06	2.559195e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-12 14:22:24.371248	\N	\N	f
2861	2026-05-12	14:53:00	11824	63	205	247	143	30	16	100	16877	913833	913933	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-12 20:54:57.825594	253	247	f
2862	2026-05-12	14:54:00	11825	63	230	262	144	30	16	353	4215	913933	914286	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-12 20:57:39.111427	253	262	f
2863	2026-05-12	16:10:00	11826	63	229	269	144	30	16	50	786729	914286	914336	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-12 22:11:50.661509	253	269	f
2864	2026-05-12	15:33:00	13136	63	242	252	\N	29	15	120	44852	2.560338e+06	2.560458e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:16:32.584855	\N	\N	f
2865	2026-05-12	15:40:00	13137	63	201	243	\N	29	15	150	12767	2.560458e+06	2.560608e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:17:04.042899	\N	\N	f
2866	2026-05-12	15:49:00	13138	63	211	254	\N	29	15	90	32214	2.560608e+06	2.560698e+06	patio	normal	CAMION SE QUEDA PARA REPARACION DE FISURAS EN ACORAZADO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:19:15.912428	\N	\N	f
2867	2026-05-12	16:30:00	13139	63	205	247	\N	29	15	80	16993	2.560699e+06	2.560779e+06	patio	normal	SE PONE A NIVEL ACEITE TRANS	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:20:33.101329	\N	\N	f
2868	2026-05-12	17:00:00	13140	63	213	256	\N	29	15	100	1.36656e+06	2.56078e+06	2.56088e+06	patio	normal	SERVICIO A/C (Lubricación de compresor, revisión de fugas, vacío, recarga de gas)  $2,200	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:23:27.693399	\N	\N	f
2869	2026-05-12	17:07:00	13141	63	206	248	\N	29	15	130	514196	2.56088e+06	2.56101e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:25:34.069744	\N	\N	f
2870	2026-05-12	17:07:00	115	63	218	239	\N	29	15	20	1437	2.56101e+06	2.56103e+06	patio	normal	SE UTILIZA ESTE FOLIO GENERICO DEBIDO A QUE NO SE GENERÓ NOTA, AYUDANTE TOMA UN BOTE DE 20 PARA EX01 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:30:41.076213	\N	\N	f
2871	2026-05-12	17:21:00	13142	63	200	268	\N	29	15	130	641895	2.56103e+06	2.56116e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:31:41.460958	\N	\N	f
2872	2026-05-12	17:39:00	13143	63	212	255	\N	29	15	100	43901	2.56116e+06	2.56126e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:32:16.549095	\N	\N	f
2873	2026-05-12	17:44:00	13144	63	226	266	\N	29	15	150	49690	2.56126e+06	2.56141e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:33:27.468703	\N	\N	f
2874	2026-05-12	17:56:00	13145	63	227	267	\N	29	15	100	451012	2.56141e+06	2.56151e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:33:51.674774	\N	\N	f
2875	2026-05-12	18:11:00	13146	63	229	269	\N	29	15	120	786794	2.56151e+06	2.56163e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:39:25.34397	\N	\N	f
2876	2026-05-12	18:20:00	13147	63	237	254	\N	29	15	50	371836	2.56163e+06	2.56168e+06	patio	normal	PROVISIONAL EL 01 MIENTRAS SE ARREGLA EL 16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:41:06.184569	\N	\N	f
2877	2026-05-12	18:32:00	13148	63	245	276	\N	29	15	100	560482	2.56168e+06	2.56178e+06	patio	normal	CAMION PROVISIONAL EN LO QUE SE ARREGLA CA12	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 00:46:25.681985	\N	\N	f
2879	2026-05-13	05:57:00	11828	63	214	257	137	30	16	100	62784	2.166495e+06	2.166595e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-13 11:59:23.15774	253	257	f
2880	2026-05-13	05:59:00	11829	63	204	246	137	30	16	100	440658	2.166595e+06	2.166695e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-13 12:08:22.494645	253	246	f
2881	2026-05-13	06:08:00	11830	63	232	250	151	30	16	100	476596	2.166695e+06	2.166795e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-13 12:47:22.302731	253	250	f
2882	2026-05-13	06:47:00	11831	63	198	241	146	30	16	100	77518	2.166795e+06	2.166895e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-13 13:46:51.707849	253	241	f
2878	2026-05-13	05:56:00	11827	63	202	244	137	30	16	100	64463	913837	\N	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-13 11:57:45.405929	253	244	f
2884	2026-05-13	09:54:00	11833	63	225	270	142	30	16	274	2632	2.166995e+06	2.167269e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-13 15:56:45.696578	253	270	t
2885	2026-05-13	09:56:00	11834	63	224	274	156	30	16	168	3767	3.7942166e+10	3.7942166e+10	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-13 16:58:54.682374	253	274	t
2886	2026-05-13	20:15:00	13150	63	233	239	\N	29	15	80	1401	2.562395e+06	2.562475e+06	patio	normal	SE ENVIA COMBUSTIBLE EN HILUX CARLOS N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 20:16:39.521153	\N	\N	f
2888	2026-05-13	17:33:00	11836	63	216	259	\N	30	16	50	5235	915130	915180	campo	normal	Medio  tanque  kedo  no se lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-13 23:37:15.983042	253	259	f
2889	2026-05-13	16:48:00	13352	63	227	267	\N	29	15	70	451229	2.562925e+06	2.562995e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-14 00:34:49.100803	\N	\N	f
2890	2026-05-13	17:07:00	13353	63	229	269	\N	29	15	70	787012	2.562995e+06	2.563065e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-14 00:35:39.007783	\N	\N	f
2891	2026-05-13	17:17:00	13354	63	242	252	\N	29	15	70	45013	2.563065e+06	2.563135e+06	patio	normal	reporta fuga en toma de fuerza	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-14 00:36:16.910381	\N	\N	f
2893	2026-05-13	17:52:00	13356	63	200	268	\N	29	15	17	642402	2.563205e+06	2.563222e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-14 00:37:45.842337	\N	\N	f
2892	2026-05-13	17:30:00	13355	63	206	248	\N	29	15	70	514442	2.563135e+06	2.563205e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-14 00:37:02.912655	\N	\N	f
2894	2026-05-14	07:57:00	11837	63	203	272	145	30	16	100	124990	915330	915430	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-14 13:59:31.19313	253	272	f
2883	2026-05-13	07:28:00	11832	63	197	240	146	30	16	100	22505	2.166895e+06	2.166995e+06	campo	normal	kilometraje original 22,505\n(Alberto n.)	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-13 13:54:07.245636	\N	240	f
2895	2026-05-14	13:05:00	11838	63	242	252	145	30	16	100	45078	915281	915381	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-14 19:29:20.848828	253	252	f
2896	2026-05-14	13:29:00	11839	63	213	256	145	30	16	100	1.366934e+06	915381	915481	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-14 19:32:19.322137	253	256	f
2897	2026-05-14	13:32:00	11840	63	214	257	143	30	16	100	63142	915481	915581	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-14 19:33:42.003487	253	257	f
2898	2026-05-14	13:33:00	11841	63	202	244	157	30	16	100	64748	915581	915681	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-14 19:43:49.329003	253	244	f
2900	2026-05-14	15:48:00	11843	63	205	247	157	30	16	100	17313	915782	915882	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-14 21:50:40.936443	253	247	f
2901	2026-05-14	14:13:00	11844	63	245	276	157	30	16	49	560902	915882	915931	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-14 22:35:32.192484	\N	276	f
2902	2026-05-14	16:05:00	13358	63	201	243	\N	29	15	120	13173	2.56425e+06	2.56437e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 00:03:20.305589	\N	\N	f
2903	2026-05-14	16:10:00	13359	63	209	251	\N	29	15	100	40008	2.56437e+06	2.56447e+06	patio	normal	RECIEN REPARADO DE BARRA + CRUCETA NUEVA $790	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 00:04:06.190564	\N	\N	f
2904	2026-05-14	16:15:00	13360	63	215	258	\N	29	15	170	44563	2.56447e+06	2.56464e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 00:05:04.731863	\N	\N	f
2905	2026-05-14	16:30:00	13361	63	226	266	\N	29	15	150	50245	2.56464e+06	2.56479e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 00:08:29.928647	\N	\N	f
2906	2026-05-14	16:40:00	13362	63	207	276	\N	29	15	64	484178	2.564791e+06	2.564855e+06	patio	normal	SE ACTIVA , CAMBIO DE PERCHAS LADO COPILOTO, CAMBIO DE BUJES	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 00:09:57.929548	\N	\N	f
2907	2026-05-14	17:10:00	131207	63	232	268	\N	29	15	50	476969	2.564855e+06	2.564905e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 00:10:40.959507	\N	\N	f
2908	2026-05-14	17:30:00	13364	63	227	267	\N	29	15	120	451520	2.564905e+06	2.565025e+06	patio	normal	Cambio de llanta pos #10 por gallo en stock 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 00:18:44.453519	\N	\N	f
2909	2026-05-14	17:40:00	13365	63	206	248	\N	29	15	100	514668	2.565026e+06	2.565126e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 00:19:34.801287	\N	\N	f
2910	2026-05-14	18:19:00	13366	63	213	256	\N	29	15	100	1.367053e+06	2.565126e+06	2.565226e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 00:20:34.606378	\N	\N	f
2930	2026-05-13	09:17:00	121	63	232	251	152	30	16	100	476969	0	100	campo	normal	OXXO GAS SAN BLAS CARGA DIRECTA CON TARJETA , TICKET: 379199080	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 21:41:08.564127	\N	251	f
2915	2026-05-14	18:01:00	11849	63	236	277	139	30	16	8	1353	916301	916309	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 04:02:44.942801	\N	277	f
2916	2026-05-14	18:10:00	11850	63	238	277	139	30	16	77	5658	916309	916386	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 04:04:07.232318	\N	277	f
2917	2026-05-14	18:28:00	11601	63	220	277	139	30	16	8	19051	916386	916394	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 04:05:32.596546	\N	277	t
2911	2026-05-14	18:23:00	11845	63	200	268	146	30	16	100	642720	915931	916031	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 00:25:35.630997	253	268	f
2914	2026-05-14	18:28:00	11848	63	221	278	139	30	16	50	6885	916251	916301	campo	normal	Cambio de anticongelante \nAsistencia mago	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 00:30:28.035793	253	278	f
2912	2026-05-14	18:25:00	11846	63	198	241	146	30	16	100	77845	916031	916131	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 00:26:57.51591	253	241	f
2913	2026-05-14	18:26:00	11847	63	199	242	146	30	16	120	134782	916131	916251	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 00:28:20.857962	253	242	f
2918	2026-05-15	05:56:00	11602	63	244	253	158	30	16	42	150391	916437	916479	campo	normal	Recarga a camioneta de servicio Nissan 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 11:58:35.619953	\N	253	f
2920	2026-05-15	07:51:00	11604	63	212	273	137	30	16	100	44372	916589	916689	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 13:53:28.585502	253	273	f
2921	2026-05-15	07:53:00	11605	63	204	246	137	30	16	100	441121	916689	916789	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 13:55:41.645731	253	246	f
2922	2026-05-15	07:55:00	11851	63	208	250	146	30	16	110	1.029153e+06	916789	916899	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 13:57:29.303741	253	250	f
2923	2026-05-15	08:28:00	11607	63	202	244	146	30	16	100	65052	916899	916999	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 14:30:04.727026	253	244	f
2779	2026-05-07	09:07:00	11595	60	197	240	152	30	16	50	21911	5247	5295	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 15:22:29.365911	239	240	f
2829	2026-05-09	13:36:00	13116	63	197	240	\N	29	15	100	22059	2.556083e+06	2.556183e+06	patio	normal	Modificar kilometraje , borrar unidad ?	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 21:31:41.087588	\N	\N	f
2924	2026-05-15	11:10:00	11608	63	230	262	144	30	16	311	4237	916999	917310	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 17:13:35.565987	253	262	f
2925	2026-05-15	12:42:00	11609	63	203	272	156	30	16	100	125313	917310	917410	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 18:45:07.680366	253	272	f
2926	2026-05-13	18:24:00	116	63	204	246	159	30	16	130	441121	0	130	campo	normal	SE CARGA DIRECTO EN OXXO GAS, TICKET:442187030	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 21:28:03.017789	\N	246	f
2928	2026-05-13	18:43:00	118	63	212	255	159	30	16	101	44372	0	101	campo	normal	CARGA DIRECTA CON TARJETA OXXOGAS. TICKET: 442187480	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 21:32:13.875016	\N	255	f
2929	2026-05-13	09:09:00	119	63	208	250	159	30	16	101	1.029153e+06	101	202	campo	normal	CARGA DIRECTA (2) CARGAS TICKET1:379198870 , TICKET2: 379198980      CARLOS N.	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 21:39:35.750706	\N	250	t
2860	2026-05-12	10:22:00	11823	63	197	240	143	30	16	100	22339	913733	913833	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-12 19:09:46.797826	\N	240	f
2899	2026-05-14	13:09:00	11842	63	197	240	145	30	16	100	22876	915682	915782	campo	normal	KILOMETRAJE REAL 22,876\nAlberto N.	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-14 19:54:07.614772	\N	240	f
2932	2026-05-14	18:30:00	13367	63	211	254	\N	29	15	100	32431	2.565227e+06	2.565327e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:17:58.913655	\N	\N	f
2931	2026-05-09	10:14:00	11808	63	197	240	151	30	16	100	22020	0	100	campo	normal	CARGA DEL DIA SABADO KILOMETRAJE REAL : 22,020	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 21:43:49.267152	\N	240	f
2933	2026-05-15	08:10:00	13369	63	216	239	\N	29	15	50	5245	2.566459e+06	2.566509e+06	patio	normal	Se manda diésel en botes a tavo	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:19:59.564685	\N	\N	f
2934	2026-05-15	11:30:00	13370	63	247	239	\N	29	15	50	\N	2.566509e+06	2.566559e+06	patio	normal	Máquina en taller , marca tanque vacío 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:22:18.189616	\N	\N	f
2935	2026-05-15	15:41:00	13371	63	214	257	\N	29	15	100	63405	2.566559e+06	2.566659e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:25:00.26156	\N	\N	f
2919	2026-05-15	07:19:00	11603	63	229	269	137	30	16	110	787354	916479	916589	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-15 13:51:19.986258	253	269	f
2936	2026-05-15	15:50:00	13372	63	204	246	\N	29	15	80	441246	2.56666e+06	2.56674e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:26:16.518091	\N	\N	f
2937	2026-05-15	16:40:00	13373	63	209	251	\N	29	15	20	40213	2.56674e+06	2.56676e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:29:03.817792	\N	\N	f
2938	2026-05-15	18:29:00	13374	63	213	256	\N	29	15	20	1.367214e+06	2.566761e+06	2.566781e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:30:22.031937	\N	\N	f
2939	2026-05-15	17:10:00	13375	63	205	247	\N	29	15	50	17512	2.566781e+06	2.566831e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:32:09.307317	\N	\N	f
2940	2026-05-15	17:25:00	13376	63	242	252	\N	29	15	10	45246	2.566832e+06	2.566842e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:35:12.261283	\N	\N	f
2941	2026-05-16	00:00:00	13377	64	242	252	\N	29	15	100	45246	2.566842e+06	2.566942e+06	patio	normal	CARGA POSTFECHADA PARA SABADO , CAMIÓN SIN COMBUSTIBLE 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:37:27.584054	\N	\N	f
2942	2026-05-15	17:55:00	13378	63	227	267	\N	29	15	70	451771	2.566942e+06	2.567012e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:38:11.962695	\N	\N	f
2943	2026-05-15	18:00:00	13379	63	206	248	\N	29	15	2	514920	2.567012e+06	2.567014e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 00:38:52.515592	\N	\N	f
2944	2026-05-15	18:23:00	13380	63	212	255	\N	29	15	50	44583	2.567014e+06	2.567064e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 01:19:15.715578	\N	\N	f
2945	2026-05-15	18:40:00	13381	63	211	254	\N	29	15	5	32652	2.567063e+06	2.567068e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 01:19:51.020022	\N	\N	f
2947	2026-05-15	14:30:00	11610	63	240	265	156	30	16	56	11212	917410	917466	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 12:49:23.555178	\N	265	f
2948	2026-05-15	18:49:00	11611	63	220	277	139	30	16	82	19051	917425	917507	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 12:52:34.320644	\N	277	t
2946	2026-05-16	00:00:00	13382	64	211	254	\N	29	15	95	32652	2.56707e+06	2.567165e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, CAMION CASI SECO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 01:20:21.445306	\N	\N	f
2949	2026-05-15	19:09:00	11612	63	197	240	151	30	16	1	23161	917505	917506	campo	normal	nota para corte	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 14:03:37.354169	\N	240	f
2950	2026-05-16	06:58:00	11613	64	206	248	160	30	16	50	514928	917507	917557	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-16 14:06:45.408568	253	248	f
2951	2026-05-16	08:06:00	11852	64	229	269	146	30	16	100	787401	917557	917657	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-16 14:08:16.620738	253	269	f
2953	2026-05-16	08:09:00	11616	64	209	251	156	30	16	100	40258	917757	917857	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-16 14:48:19.369909	253	251	f
2954	2026-05-16	09:01:00	11617	64	197	240	156	30	16	100	23180	917899	917999	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 15:22:30.268065	\N	240	f
2927	2026-05-13	18:25:00	117	63	215	258	159	30	16	100	44563	0	100	campo	normal	CARGA DIRECTA CON TARJETA EN OXXO GAS    TICKET: 442187040	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-15 21:30:51.290363	\N	258	f
2955	2026-05-15	18:00:00	123	63	208	250	162	30	16	1	1.029343e+06	0	1	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 15:26:16.065186	\N	250	f
2956	2026-05-15	18:00:00	124	63	199	242	162	30	16	1	135045	0	1	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 15:27:03.639142	\N	242	f
2957	2026-05-15	18:01:00	125	63	215	258	162	30	16	1	44888	-2	-1	campo	normal	MEDIO TANQUE +	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 15:27:51.003832	\N	258	f
2958	2026-05-15	18:01:00	126	63	203	272	162	30	16	1	125344	1	2	campo	normal	MEDIO TANQUE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 15:28:56.359769	\N	272	f
2959	2026-05-15	18:00:00	127	63	201	243	162	30	16	1	13456	0	1	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 15:30:59.963307	\N	243	f
2960	2026-05-15	18:00:00	128	63	226	266	162	30	16	1	50473	0	1	campo	normal	ENTRE 1/4 Y 1/2 TANQUE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 15:37:35.958443	\N	266	f
2961	2026-05-15	18:00:00	129	63	207	276	162	30	16	1	484395	0	1	campo	normal	MEDIO TANQUE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 15:39:22.027147	\N	276	f
2952	2026-05-15	18:08:00	130	64	198	241	162	30	16	1	78020	0	\N	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-16 14:09:58.75975	253	241	f
2963	2026-05-16	23:42:00	13384	64	248	243	\N	29	15	50	562806	2.568296e+06	2.568346e+06	patio	normal	Prueba	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 18:54:01.966221	\N	\N	f
2964	2026-05-16	12:30:00	13385	64	201	243	\N	29	15	150	13456	2.568346e+06	2.568496e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 18:54:58.804878	\N	\N	t
2965	2026-05-16	12:40:00	13386	64	208	250	\N	29	15	150	1.029343e+06	2.568497e+06	2.568647e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 18:55:36.567996	\N	\N	t
2966	2026-05-16	12:54:00	131211	64	213	256	\N	29	15	100	1.367292e+06	2.568647e+06	2.568747e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 20:14:02.801257	\N	\N	f
2967	2026-05-16	13:01:00	13388	64	203	272	\N	29	15	120	125472	2.568748e+06	2.568868e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 20:14:37.225052	\N	\N	f
2968	2026-05-16	13:15:00	13389	64	229	269	\N	29	15	100	787545	2.568868e+06	2.568968e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 20:15:06.612953	\N	\N	f
2969	2026-05-16	13:22:00	13390	64	206	248	\N	29	15	100	515047	2.568968e+06	2.569068e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 20:15:41.128328	\N	\N	f
2970	2026-05-16	13:40:00	13391	64	204	246	\N	29	15	90	441420	2.569068e+06	2.569158e+06	patio	normal	SALE DE VACACIONES CHOFER, DEJA PENDIENTES DE REPARACION	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 20:16:25.985337	\N	\N	f
2972	2026-05-16	13:53:00	13393	64	211	254	\N	29	15	70	32741	2.569259e+06	2.569329e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 20:17:49.54603	\N	\N	f
2971	2026-05-16	13:46:00	13393	64	214	257	\N	29	15	100	63543	2.569159e+06	2.569259e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 20:17:09.021592	\N	\N	f
2962	2026-05-16	09:52:00	11815	64	198	241	161	30	16	100	78040	917657	917757	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 15:53:40.443685	\N	241	f
2973	2026-05-16	09:12:00	11618	64	244	253	156	30	16	42	150391	917757	917799	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 21:17:28.926533	\N	253	f
2974	2026-05-16	09:46:00	11619	64	207	276	156	30	16	100	484395	917799	917899	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 21:18:26.963259	\N	276	t
2975	2026-05-16	10:30:00	11620	64	224	274	156	30	16	100	3820	917899	917999	campo	normal	Medio tanque 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 21:20:07.757085	\N	274	f
2976	2026-05-16	14:10:00	13394	64	242	252	\N	29	15	100	45318	2.569329e+06	2.569429e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 15:07:54.319418	\N	\N	f
2977	2026-05-16	14:29:00	13395	64	215	258	\N	29	15	100	45074	2.569429e+06	2.569529e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 15:09:57.530095	\N	\N	f
2978	2026-05-16	14:32:00	13396	64	202	244	\N	29	15	100	65410	2.569529e+06	2.569629e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 15:10:27.867666	\N	\N	f
2979	2026-05-16	14:40:00	13397	64	237	268	\N	29	15	100	372171	2.56963e+06	2.56973e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 15:11:02.199123	\N	\N	f
2980	2026-05-16	14:46:00	13398	64	245	267	\N	29	15	50	560986	2.56973e+06	2.56978e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 15:11:36.203608	\N	\N	f
2981	2026-05-16	14:58:00	13399	64	226	266	\N	29	15	150	50669	2.56978e+06	2.56993e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 15:12:18.097989	\N	\N	f
2982	2026-05-16	15:09:00	13400	64	212	255	\N	29	15	100	44773	2.56993e+06	2.57003e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 15:13:06.883021	\N	\N	f
2983	2026-05-16	15:20:00	13401	64	209	251	\N	29	15	80	40392	2.57003e+06	2.57011e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 15:21:29.597078	\N	\N	f
2984	2026-05-16	15:33:00	13402	64	205	247	\N	29	15	100	17609	2.57011e+06	2.57021e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 15:30:14.927094	\N	\N	f
2985	2026-05-18	10:28:00	11621	64	199	242	163	30	16	120	135100	917999	918119	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-18 16:48:41.751357	253	242	f
2987	2026-05-18	14:40:00	11623	64	240	271	156	30	16	50	11223.9	918402	918452	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-18 20:42:37.934497	253	271	f
2986	2026-05-18	10:48:00	11622	64	225	270	142	30	16	283	2675.7	918119	918402	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-18 16:50:23.633964	253	270	f
2988	2026-05-18	12:50:00	13404	64	233	264	\N	29	15	80	1401	2.570912e+06	2.570992e+06	patio	normal	Hilux \nCarlos N.	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 23:45:33.984451	\N	\N	f
2989	2026-05-18	12:55:00	13405	64	239	239	\N	29	15	20	\N	2.570993e+06	2.571013e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 23:48:39.033603	\N	\N	f
2990	2026-05-18	15:40:00	13406	64	214	257	\N	29	15	100	63736	2.571013e+06	2.571113e+06	patio	normal	1 urea	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 23:50:31.294456	\N	\N	f
2991	2026-05-18	15:50:00	13407	64	229	269	\N	29	15	50	787799	2.571113e+06	2.571163e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 23:53:02.510414	\N	\N	f
2993	2026-05-18	16:11:00	13409	64	213	256	\N	29	15	100	1.367477e+06	2.571263e+06	2.571363e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 23:55:59.680224	\N	\N	f
2994	2026-05-18	16:26:00	13410	64	207	276	\N	29	15	100	484676	2.571363e+06	2.571463e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 23:56:33.482065	\N	\N	f
2995	2026-05-18	16:26:00	13411	64	205	247	\N	29	15	100	17744	2.571463e+06	2.571563e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 23:58:47.055106	\N	\N	f
2996	2026-05-18	16:46:00	13412	64	211	254	\N	29	15	70	32889	2.571563e+06	2.571633e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 23:59:54.432187	\N	\N	f
2997	2026-05-18	16:54:00	13413	64	215	258	\N	29	15	100	45184	2.571633e+06	2.571733e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-19 00:00:24.677565	\N	\N	f
2998	2026-05-18	17:02:00	13414	64	209	251	\N	29	15	100	40567	2.571733e+06	2.571833e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-19 00:03:41.571689	\N	\N	f
2999	2026-05-18	17:10:00	13415	64	242	252	\N	29	15	100	45401	2.571833e+06	2.571933e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-19 00:04:40.168728	\N	\N	f
3000	2026-05-18	17:20:00	13416	64	202	244	\N	29	15	100	65601	2.571933e+06	2.572033e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-19 00:05:51.409616	\N	\N	f
3001	2026-05-18	17:28:00	13417	64	212	255	\N	29	15	100	44921	2.572034e+06	2.572134e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-19 00:06:25.258049	\N	\N	f
3003	2026-05-19	06:18:00	11624	64	198	241	146	30	16	100	78375	918452	918552	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-19 12:30:20.665298	253	241	f
2992	2026-05-18	16:04:00	13408	64	226	266	\N	29	15	100	50852	2.571163e+06	2.571263e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-18 23:53:43.970252	\N	\N	t
3004	2026-05-19	08:54:00	11625	64	230	262	144	30	16	275	4256	918552	918827	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-19 14:55:54.457812	253	262	f
3005	2026-05-19	10:18:00	11626	64	216	259	138	30	16	83	5253	918827	918910	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-19 16:21:06.432396	253	259	f
3006	2026-05-19	10:21:00	11627	64	219	259	138	30	16	60	2753	918910	918970	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-19 16:34:31.170479	253	259	f
3007	2026-05-19	12:45:00	11628	64	224	274	156	30	16	60	3836	918970	919030	campo	normal	Avajo del medio tanque	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-19 18:48:06.262177	253	274	f
3002	2026-05-18	17:42:00	13418	64	206	248	\N	29	15	100	515047	2.572134e+06	2.572234e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-19 00:12:41.185502	\N	\N	t
3008	2026-05-19	15:49:00	13420	64	199	242	\N	29	15	100	135547	2.57329e+06	2.57339e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-19 23:03:33.279776	\N	\N	f
3009	2026-05-19	17:31:00	13422	64	206	248	\N	29	15	100	515531	2.57339e+06	2.57349e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-20 00:28:46.356841	\N	\N	f
3010	2026-05-19	17:44:00	13423	64	211	254	\N	29	15	100	32889	2.57349e+06	2.57359e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-20 00:29:12.682415	\N	\N	t
3011	2026-05-19	04:50:00	11629	64	203	272	163	30	16	100	125912	919232	919332	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-20 12:18:28.150062	\N	272	f
3012	2026-05-20	08:56:00	11630	64	198	241	146	30	16	70	78534	919332	919402	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-20 15:00:29.609811	253	241	f
3014	2026-05-20	08:00:00	13425	64	229	269	\N	29	15	260	787999	2.573641e+06	2.573901e+06	patio	normal	PRUEBA DE RENDIMIENTO DIA 1	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-20 15:58:09.972556	\N	\N	f
3015	2026-05-20	11:48:00	11632	64	208	250	146	30	16	100	1.02964e+06	919502	919602	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-20 17:50:43.47106	253	250	f
3016	2026-05-20	16:07:00	11633	64	207	276	146	30	16	100	485040	919602	919702	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-20 22:14:59.119273	253	276	f
3017	2026-05-20	16:14:00	11634	64	242	252	146	30	16	100	45620	919702	919802	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-20 22:16:44.98474	253	252	f
3018	2026-05-20	16:16:00	11635	64	212	255	164	30	16	100	45295	919802	919902	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-20 22:19:25.086782	253	255	f
3019	2026-05-20	16:22:00	11636	64	244	253	165	30	16	17	150391	919902	919919	campo	normal	Km152891	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-20 22:32:16.049972	253	253	t
3020	2026-05-19	18:20:00	13424	64	232	268	\N	29	15	50	477142	2.57395e+06	2.574e+06	patio	normal	Se activa , reparación de bomba y servonde clutch\n	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-20 23:03:44.38087	\N	\N	f
3021	2026-05-20	16:05:00	13426	64	205	247	\N	29	15	100	18062	2.573904e+06	2.574004e+06	patio	normal	Dentro del rango 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-20 23:07:10.143591	\N	\N	f
3023	2026-05-20	16:20:00	13428	64	215	258	\N	29	15	100	45639	2.574154e+06	2.574254e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-20 23:08:49.752121	\N	\N	f
3024	2026-05-20	16:41:00	13429	64	214	257	\N	29	15	100	64208	2.574254e+06	2.574354e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-20 23:11:17.266675	\N	\N	f
3022	2026-05-20	16:10:00	13427	64	226	266	\N	29	15	150	51339	2.574004e+06	2.574154e+06	patio	normal	Carga de más compadre Carlos N, también el gordo mamón se pasó de lanza si ya sabe 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-20 23:08:07.578858	\N	\N	f
3025	2026-05-20	16:59:00	13430	64	248	240	\N	29	15	20	562829	2.574354e+06	2.574374e+06	patio	normal	SE LLEVA CAMION TOMAS PARA DEJARLO MAÑANA CON MELCHOR\n	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-21 00:51:49.618265	\N	\N	f
3026	2026-05-20	17:10:00	13431	64	211	254	\N	29	15	100	33293	2.574374e+06	2.574474e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-21 00:52:32.961498	\N	\N	f
3027	2026-05-20	17:20:00	13432	64	209	251	\N	29	15	100	41034	2.574474e+06	2.574574e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-21 00:53:58.328278	\N	\N	f
3028	2026-05-20	17:25:00	13433	64	227	267	\N	29	15	100	451951	2.574574e+06	2.574674e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-21 00:54:41.368967	\N	\N	f
3029	2026-05-20	17:40:00	13434	64	213	256	\N	29	15	100	1.36788e+06	2.574674e+06	2.574774e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-21 00:56:46.868328	\N	\N	f
3013	2026-05-20	09:00:00	11631	64	202	244	146	30	16	100	65952	919402	919502	campo	normal	DENTRO DEL RANGO 3.51 KM/L	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-20 15:02:33.859079	253	244	f
3030	2026-05-20	17:45:00	13435	64	202	244	\N	29	15	100	66226	2.574774e+06	2.574874e+06	patio	normal	DENTRO DEL RANGO  2.71 ,   VIAJES	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-21 01:03:57.91301	\N	\N	f
3075	2026-05-22	\N	\N	64	201	\N	\N	31	\N	1	14255	\N	\N	externo	normal	[Externo] NOTA PARA CORTE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 17:34:46.648384	\N	\N	f
3031	2026-05-20	18:00:00	13436	64	201	243	\N	29	15	120	13919	2.574874e+06	2.574994e+06	patio	normal	AUTORICÉ CARGA DE 120 POR QUE LA AGUJA YA ESTABA PEGANDO CASI HASTA ABAJO DE LA RESERVA , RENDIMIENTO DE 3.12 DESDE LA ULTIMA CARGA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-21 01:06:15.712692	\N	\N	f
3032	2026-05-20	18:15:00	13437	64	232	268	\N	29	15	100	477423	2.574994e+06	2.575094e+06	patio	normal	DENTRO DEL RANGO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-21 01:08:32.143083	\N	\N	f
3033	2026-05-20	19:30:00	13438	64	206	248	\N	29	15	100	515857	2.575094e+06	2.575194e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 00:49:35.551084	\N	\N	f
3034	2026-05-21	20:20:00	13439	64	229	269	\N	29	15	118	788256	2.575194e+06	2.575312e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 00:50:36.822365	\N	\N	f
3035	2026-05-21	08:58:00	13440	64	233	264	\N	29	15	80	1457	2.575312e+06	2.575392e+06	patio	normal	80 litros enviados en Hilux \nMaravillas 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 00:52:10.13992	\N	\N	f
3036	2026-05-21	17:46:00	13441	64	209	251	\N	29	15	80	41244	2.575392e+06	2.575472e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 00:52:52.60682	\N	\N	f
3037	2026-05-21	05:58:00	11637	64	212	255	\N	30	16	100	45410	9	109	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 12:00:10.535516	\N	255	f
2887	2026-05-13	15:20:00	11835	63	234	271	144	30	16	1	3686.6	914880	915130	campo	normal	No se lleno el tanque kedo ariva de 3/4\nSe retiran 260 litros el 22 de mayo , 100 al camion 12 directo en yogas , 160 se fueron a la nissan	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-13 21:23:51.038376	253	271	f
3038	2026-05-21	15:28:00	11638	64	230	262	144	30	16	327	4277	920020	920347	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 12:08:51.841377	\N	262	f
3039	2026-05-22	06:13:00	11640	64	203	272	163	30	16	100	126272	920347	920447	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 12:15:23.274132	\N	272	f
3040	2026-05-22	05:30:00	11641	64	199	242	163	30	16	100	135936	920447	920547	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 12:17:39.499438	\N	242	f
3041	2026-05-22	05:45:00	11642	64	208	250	163	30	16	100	1.029961e+06	920547	920647	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 12:19:45.237876	\N	250	f
3042	2026-05-22	06:00:00	11643	64	198	241	146	30	16	77	78726	920647	920724	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 12:21:12.400222	\N	241	f
3043	2026-05-21	\N	\N	64	207	\N	144	31	\N	100	485335	\N	\N	externo	normal	[Diésel ex13] 11639 folio \nSe le cargan 100 litros sacados de la ex13 directo de yogas	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 14:20:18.507423	\N	\N	f
3044	2026-05-22	07:00:00	11644	64	211	254	145	30	16	70	33451	920725	920795	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 16:57:27.544239	\N	254	f
3045	2026-05-22	07:13:00	11645	64	232	268	145	30	16	50	477599	920795	920845	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 17:49:44.292682	\N	268	f
3046	2026-05-22	09:08:00	11646	64	240	271	156	30	16	60	11223.9	920845	920905	campo	normal	PENDIENTE HOROMETRO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 17:53:52.381937	\N	271	f
3047	2026-05-22	09:14:00	11647	64	224	274	156	30	16	60	3848	920905	920965	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 17:54:23.862521	\N	274	f
3048	2026-05-22	10:05:00	11648	64	202	244	145	30	16	50	66551	920965	921015	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 17:54:50.737916	\N	244	f
3049	2026-05-22	09:59:00	116486	64	201	243	145	30	16	50	14163	921015	921065	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 17:56:58.036908	\N	243	f
3050	2026-05-22	11:40:00	11650	64	227	267	145	30	16	100	452230	921066	921166	campo	normal	SE LE COLGO EL DIESEL, MOTIVO DE CARGA DE 100L	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-22 17:58:48.489765	\N	267	f
3051	2026-05-22	08:20:00	13443	64	229	269	\N	29	15	80	788418	2.576477e+06	2.576557e+06	patio	normal	prueba carga 3	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:34:26.051157	\N	\N	f
3052	2026-05-22	08:40:00	13444	64	242	252	\N	29	15	95	45717	2.576556e+06	2.576651e+06	patio	normal	AUTORIZADA ESA CANTIDAD POR QUE LA AGUJA ESTABA MUY ABAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:35:30.391662	\N	\N	f
3053	2026-05-22	10:30:00	13445	64	216	259	\N	29	15	40	5268	2.576651e+06	2.576691e+06	patio	normal	SE MANDAN 40 LITROS A VALLE REAL\nSE LLEVA REVOLVEDORA MULTIQUIP A OBRA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:37:41.985776	\N	\N	f
3055	2026-05-22	00:07:00	11651	64	213	256	145	30	16	70	1.368065e+06	921166	921236	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:43:57.851937	\N	256	f
3056	2026-05-22	14:00:00	13448	64	226	266	\N	29	15	50	51672	2.577637e+06	2.577687e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:49:46.794915	\N	\N	f
3057	2026-05-22	14:35:00	13449	64	215	258	\N	29	15	50	45812	2.577687e+06	2.577737e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:50:23.822303	\N	\N	f
3058	2026-05-22	15:40:00	13450	64	212	255	\N	29	15	20	45686	2.577737e+06	2.577757e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:51:13.259369	\N	\N	f
3059	2026-05-23	00:00:00	13501	65	212	255	\N	29	15	100	45686	2.577757e+06	2.577857e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:52:22.347206	\N	\N	f
3060	2026-05-22	16:05:00	13502	64	209	251	\N	29	15	5	41431	2.577857e+06	2.577862e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:53:57.991303	\N	\N	f
3061	2026-05-23	00:00:00	13503	65	209	251	\N	29	15	100	41432	2.577862e+06	2.577962e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:55:01.133933	\N	\N	f
3062	2026-05-22	16:13:00	13504	64	207	276	\N	29	15	1	485591	2.577962e+06	2.577963e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:55:47.232126	\N	\N	f
3063	2026-05-23	00:00:00	13505	65	207	276	\N	29	15	100	485591	2.577963e+06	2.578063e+06	patio	normal	CARGA POSTFECHADA , NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:56:39.82607	\N	\N	f
3064	2026-05-22	16:23:00	13506	64	211	254	\N	29	15	5	33647	2.578063e+06	2.578068e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:57:30.19269	\N	\N	f
3065	2026-05-23	00:00:00	13507	65	211	254	\N	29	15	100	33647	2.578069e+06	2.578169e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:58:20.606525	\N	\N	f
3066	2026-05-22	17:30:00	13508	64	229	269	\N	29	15	85	788615	2.578169e+06	2.578254e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:59:27.58287	\N	\N	f
3067	2026-05-22	17:48:00	13509	64	205	247	\N	29	15	20	18339	2.578254e+06	2.578274e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 16:02:28.826961	\N	\N	f
3068	2026-05-23	00:00:00	13510	65	205	247	\N	29	15	100	18339	2.578274e+06	2.578374e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 16:04:02.74671	\N	\N	f
3069	2026-05-22	18:30:00	13511	64	232	246	\N	29	15	50	477808	2.578374e+06	2.578424e+06	patio	normal	SALE A LABORAR ENRIQUE EN LO QUE QUEDA LISTO CA27	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 16:07:18.527831	\N	\N	f
3054	2026-05-22	11:00:00	13446	64	220	\N	\N	29	15	40	19051	2.576691e+06	2.576731e+06	patio	normal	OBRA MARAVILLAS ARQ ALAIN\nFE DE ERRATAS: ES PLANTA VERDE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 15:39:47.529104	\N	\N	f
3070	2026-05-22	\N	\N	64	198	\N	\N	31	\N	1	78922	\N	\N	externo	normal	[Externo] NOTA PARA CORTE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 17:10:51.4821	\N	\N	f
3071	2026-05-22	14:23:00	11652	64	214	257	143	30	16	100	64450	921236	921336	campo	normal	TANQUE EN RESERVA MUY BAJA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 17:18:59.198691	\N	257	f
3072	2026-05-22	19:18:00	11653	64	221	278	139	30	16	80	6902	921336	921416	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 17:19:53.532389	\N	278	f
3073	2026-05-22	16:51:00	11654	64	220	277	139	30	16	77	19051	921416	921493	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 17:21:50.879333	\N	277	f
3074	2026-05-22	\N	\N	64	199	\N	\N	31	\N	1	136157	\N	\N	externo	normal	[Externo] NOTA PARA CORTE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 17:31:38.064076	\N	\N	f
3076	2026-05-22	\N	\N	64	203	\N	\N	31	\N	1	126502	\N	\N	externo	normal	[Externo] NOTA PARA CORTE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 17:35:50.336331	\N	\N	f
3077	2026-05-22	\N	\N	64	208	\N	\N	31	\N	1	1.030188e+06	\N	\N	externo	normal	[Externo] NOTA PARA CORTE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 17:38:01.0717	\N	\N	f
3078	2026-05-23	13:03:00	11655	65	206	248	145	30	16	50	516137	921493	921543	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-23 19:06:30.607447	253	248	f
3079	2026-05-23	13:06:00	11656	65	228	268	145	30	16	50	2956	921543	921593	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-23 19:08:17.950057	253	268	f
3080	2026-05-23	13:08:00	11657	65	201	243	143	30	16	120	14286	921593	921713	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-23 19:10:24.797425	253	243	f
3081	2026-05-23	13:10:00	11658	65	242	252	143	30	16	120	45809	921713	921833	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-23 19:12:36.843736	253	252	f
3082	2026-05-23	13:12:00	11659	65	199	242	166	30	16	30	136232	921833	921863	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-23 19:14:48.997997	253	242	f
3083	2026-05-23	13:14:00	11660	65	208	250	164	30	16	40	1.030243e+06	921863	921903	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-23 19:17:49.471677	253	250	f
3084	2026-05-23	13:17:00	11661	65	202	244	146	30	16	100	66744	921903	922003	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-23 19:22:01.206487	253	244	f
3085	2026-05-23	22:30:00	13512	65	206	248	\N	29	15	80	516195	2.578424e+06	2.578504e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:20:56.123011	\N	\N	f
3086	2026-05-23	12:20:00	13513	65	198	241	\N	29	15	100	78996	2.578509e+06	2.578609e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:25:24.560749	\N	\N	f
3087	2026-05-23	23:21:00	13514	65	215	258	\N	29	15	100	45909	2.578609e+06	2.578709e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:26:18.955002	\N	\N	f
3088	2026-05-23	23:40:00	13515	65	227	267	\N	29	15	100	452389	2.578709e+06	2.578809e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:29:00.71321	\N	\N	f
3089	2026-05-23	23:50:00	13516	65	203	272	\N	29	15	150	126596	2.57881e+06	2.57896e+06	patio	normal	NIVEL DE DIESEL EN RESERVA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:30:01.286069	\N	\N	f
3090	2026-05-23	12:00:00	13517	65	226	266	\N	29	15	120	51804	2.57896e+06	2.57908e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:30:31.479537	\N	\N	f
3091	2026-05-23	12:08:00	13518	65	214	257	\N	29	15	50	64602	2.57908e+06	2.57913e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:43:03.429066	\N	\N	f
3092	2026-05-23	12:12:00	13519	65	208	250	\N	29	15	111	1.030271e+06	2.57913e+06	2.579241e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:48:39.547511	\N	\N	f
3093	2026-05-23	12:30:00	13520	65	213	256	\N	29	15	100	1.368134e+06	2.579241e+06	2.579341e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:49:35.63931	\N	\N	f
3094	2026-05-23	13:10:00	13521	65	228	268	\N	29	15	50	3070	2.579341e+06	2.579391e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:51:37.803814	\N	\N	f
3095	2026-05-23	13:25:00	13522	65	242	252	\N	29	15	50	45839	2.579391e+06	2.579441e+06	patio	normal	HUBODOMETRO FALLANDO, REQUIERE NUEVO\nSE INSTALA LUNES	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:53:35.452254	\N	\N	f
3096	2026-05-23	13:30:00	13523	65	199	242	\N	29	15	150	136334	2.579442e+06	2.579592e+06	patio	normal	NIVEL EN RESERVA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:55:21.252194	\N	\N	f
3097	2026-05-23	13:45:00	13524	65	202	244	\N	29	15	100	66883	2.579592e+06	2.579692e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 20:56:07.998291	\N	\N	f
3098	2026-05-23	15:00:00	13525	65	205	247	\N	29	15	50	18517	2.579692e+06	2.579742e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-25 04:59:36.774888	\N	\N	f
3099	2026-05-23	15:09:00	13526	65	209	251	\N	29	15	50	41643	2.579741e+06	2.579791e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-25 05:00:36.247491	\N	\N	f
3100	2026-05-25	09:29:00	11662	65	230	262	144	30	16	100	4292	922003	922103	campo	normal	No se lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-25 15:31:34.416492	253	262	f
3101	2026-05-25	15:00:00	13258	65	214	257	\N	29	15	100	64784	2.580297e+06	2.580397e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-25 22:59:27.893684	\N	\N	f
3102	2026-05-25	15:40:00	13529	65	201	243	\N	29	15	100	14538	2.580397e+06	2.580497e+06	patio	normal	reserva	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-25 23:01:06.799542	\N	\N	f
3103	2026-05-25	16:00:00	13530	65	211	254	\N	29	15	120	33879	2.580497e+06	2.580617e+06	patio	normal	nivel bajo, le pusimos el viernes en la tarde luego luego despues del corte carga postfechada para sabado	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-25 23:04:50.267186	\N	\N	f
3104	2026-05-25	16:10:00	13531	65	232	267	\N	29	15	50	477888	2.580617e+06	2.580667e+06	patio	normal	LO AGARRA BERNA, DEJA 07	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-25 23:05:53.265762	\N	\N	f
3105	2026-05-25	16:25:00	13532	65	226	266	\N	29	15	80	51971	2.580668e+06	2.580748e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-25 23:06:54.940219	\N	\N	f
3106	2026-05-25	16:40:00	13533	65	228	268	\N	29	15	100	3241	2.580748e+06	2.580848e+06	patio	normal	NIVEL BAJON	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-25 23:08:05.01263	\N	\N	f
3107	2026-05-25	16:50:00	13534	65	213	256	\N	29	15	80	1.368293e+06	2.580847e+06	2.580927e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-25 23:08:42.805707	\N	\N	f
3108	2026-05-25	16:50:00	13535	65	209	251	\N	29	15	90	41851	2.580927e+06	2.581017e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 03:19:22.889117	\N	\N	f
3109	2026-05-25	17:20:00	13536	65	215	258	\N	29	15	80	46142	2.581018e+06	2.581098e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 03:20:43.532648	\N	\N	f
3110	2026-05-25	17:42:00	13537	65	206	248	\N	29	15	100	516454	2.581098e+06	2.581198e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 03:25:45.532643	\N	\N	f
3111	2026-05-25	18:00:00	13538	65	205	247	\N	29	15	100	18720	2.581198e+06	2.581298e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 03:26:42.934868	\N	\N	f
3112	2026-05-25	18:20:00	13539	65	242	252	\N	29	15	100	45915	2.581298e+06	2.581398e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 03:28:01.710909	\N	\N	f
3113	2026-05-25	18:45:00	13540	65	204	247	\N	29	15	80	441620	2.581398e+06	2.581478e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 03:28:50.70216	\N	\N	f
3114	2026-05-25	19:29:00	13541	65	212	255	\N	29	15	100	45972	2.581478e+06	2.581578e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 03:29:54.760041	\N	\N	f
3115	2026-05-26	08:08:00	11663	65	202	244	146	30	16	100	67144	922103	922203	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-26 14:10:04.727175	253	244	f
3116	2026-05-26	09:22:00	11664	65	198	241	146	30	16	60	79195	922203	922263	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-26 15:24:05.842442	253	241	f
3117	2026-05-26	12:34:00	11665	65	234	271	144	30	16	100	3689.4	922263	922363	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-26 18:37:29.769097	253	271	f
3118	2026-05-26	12:37:00	11666	65	230	262	144	30	16	200	4304	922363	922563	campo	normal	3/4 de tanque	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-26 18:40:18.220406	253	262	f
3119	2026-05-26	14:27:00	11667	65	216	259	138	30	16	50	5277	922563	922613	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-26 20:30:04.428996	253	259	f
3120	2026-05-26	14:30:00	11668	65	219	259	138	30	16	19	2765	922613	922632	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-26 20:35:51.704774	253	259	f
3121	2026-05-26	10:14:00	13542	65	249	239	\N	29	15	28	\N	2.581578e+06	2.581606e+06	patio	normal	Sale a maravillas 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 22:15:00.578462	\N	\N	f
3122	2026-05-26	23:00:00	13543	65	233	264	\N	29	15	40	1488	2.581606e+06	2.581646e+06	patio	normal	A maravillas 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 22:23:49.89006	\N	\N	f
3123	2026-05-26	12:50:00	13544	65	208	250	\N	29	15	130	1.030521e+06	2.581645e+06	2.581775e+06	patio	normal	 nivel de diésel extremadamente bajo 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 22:25:24.661568	\N	\N	f
3124	2026-05-26	15:10:00	13545	65	201	243	\N	29	15	80	14735	2.581775e+06	2.581855e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 22:26:06.441673	\N	\N	f
3125	2026-05-26	16:06:00	13546	65	226	266	\N	29	15	80	52156	2.581855e+06	2.581935e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 22:26:48.147564	\N	\N	f
3126	2026-05-26	16:15:00	13547	65	215	258	\N	29	15	50	46307	2.581935e+06	2.581985e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 22:28:37.902941	\N	\N	f
3127	2026-05-26	16:28:00	13548	65	229	269	\N	29	15	50	789060	2.581988e+06	2.582038e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-26 22:36:45.088792	\N	\N	f
3128	2026-05-26	17:08:00	13549	65	214	257	\N	29	15	70	65011	2.582038e+06	2.582108e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-27 00:09:05.441304	\N	\N	f
3129	2026-05-26	18:00:00	13550	65	206	248	\N	29	15	80	516676	2.582108e+06	2.582188e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-27 00:09:42.554069	\N	\N	f
3130	2026-05-26	18:06:00	13551	65	209	251	\N	29	15	95	42071	2.582188e+06	2.582283e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-27 00:32:33.590283	\N	\N	f
3131	2026-05-26	18:15:00	13552	65	232	267	\N	29	15	70	478067	2.582283e+06	2.582353e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-27 00:33:14.586815	\N	\N	f
3162	2026-05-28	22:40:00	13575	65	212	255	\N	29	15	82	46454	2.586926e+06	2.587008e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:08:49.820922	\N	\N	f
3132	2026-05-26	18:33:00	13553	65	205	247	\N	29	15	80	18918	2.582353e+06	2.582433e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-27 00:34:22.697305	\N	\N	f
3135	2026-05-26	18:40:00	13554	65	212	255	\N	29	15	80	46185	2.582434e+06	2.582514e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-27 02:54:27.373389	\N	\N	f
3136	2026-05-26	18:45:00	13555	65	228	268	\N	29	15	80	3477	2.582514e+06	2.582594e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-27 02:55:50.15087	\N	\N	f
3137	2026-05-26	19:00:00	13556	65	213	256	\N	29	15	80	1.368502e+06	2.582594e+06	2.582674e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-27 02:57:45.244955	\N	\N	f
3138	2026-05-27	05:53:00	11671	65	203	272	163	30	16	120	126930	922712	922832	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-27 13:54:35.374639	\N	272	f
3139	2026-05-27	06:35:00	11672	65	199	242	163	30	16	80	136646	922832	922912	campo	normal	FIN TANQUE MAGO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-27 13:55:28.91083	\N	242	f
3140	2026-05-27	15:20:00	11673	65	196	274	154	30	16	20	11247.9	2.576476e+06	2.576496e+06	campo	normal	8 litros de relleno hidraulico	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-27 21:24:24.321168	253	274	f
3141	2026-05-27	15:24:00	11674	65	208	250	157	30	16	100	1.030733e+06	2.576496e+06	2.576596e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-27 21:26:25.231251	253	250	f
3142	2026-05-27	15:26:00	11675	65	202	244	157	30	16	100	67482	2.576596e+06	2.576696e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-27 21:28:20.295521	253	244	f
3143	2026-05-27	15:28:00	11676	65	242	252	146	30	16	50	45979	2.576696e+06	2.576746e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-27 21:30:01.906923	253	252	f
3144	2026-05-27	15:30:00	11677	65	212	273	146	30	16	60	46300	2.576746e+06	2.576806e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-27 21:32:30.616256	253	273	f
3145	2026-05-27	15:32:00	11678	65	209	251	157	30	16	50	42204	2.576806e+06	2.576856e+06	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-27 21:34:36.101443	253	251	f
3133	2026-05-26	20:01:00	11669	65	248	253	160	30	16	30	562888	922632	922662	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-27 02:03:27.16997	253	253	f
3134	2026-05-26	20:03:00	11670	65	211	254	160	30	16	50	34061	922662	922712	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-27 02:05:38.285537	253	254	f
3146	2026-05-27	17:46:00	11679	65	242	\N	\N	30	16	60	45979	2.576856e+06	2.576916e+06	campo	normal	50km recorridos de la ultima carga hace 2 horas	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 17:43:00.188338	\N	\N	f
3147	2026-05-27	18:04:00	11680	65	204	246	160	30	16	120	441943	923334	923454	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 17:51:09.489336	\N	246	f
3148	2026-05-27	23:50:00	13559	65	211	254	\N	29	15	50	34061	2.583885e+06	2.583935e+06	patio	normal	SALE DE REPARACION RAPIDA DE MUELLE PRINCIPAL DAÑADA (DELANTERA) UNA EN STOCK	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:05:33.219868	\N	\N	f
3150	2026-05-27	16:10:00	13561	65	213	256	\N	29	15	100	1.368658e+06	2.58406e+06	2.58416e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:18:31.995674	\N	\N	f
3151	2026-05-27	16:20:00	13562	65	245	240	\N	29	15	70	561662	2.584161e+06	2.584231e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:19:07.496069	\N	\N	f
3152	2026-05-27	16:30:00	13563	65	201	243	\N	29	15	100	14920	2.584231e+06	2.584331e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:19:59.723349	\N	\N	f
3154	2026-05-27	16:55:00	13565	65	232	267	\N	29	15	70	478282	2.584432e+06	2.584502e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:21:51.266913	\N	\N	f
3149	2026-05-27	16:00:00	13560	65	214	257	\N	29	15	120	65212	2.58394e+06	2.58406e+06	patio	normal	EN LA RESERVA\nCARGA 1 UREA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:17:39.382897	\N	\N	f
3153	2026-05-27	16:40:00	13564	65	226	266	\N	29	15	100	52439	2.584332e+06	2.584432e+06	patio	normal	CARGA 1 UREA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:21:11.746453	\N	\N	f
3155	2026-05-27	17:02:00	13566	65	215	258	\N	29	15	110	46587	2.584502e+06	2.584612e+06	patio	normal	CARGA 1 UREA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:22:32.207265	\N	\N	f
3156	2026-05-27	17:15:00	13567	65	229	269	\N	29	15	100	789323	2.584615e+06	2.584715e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:25:31.803659	\N	\N	f
3157	2026-05-27	17:45:00	13568	65	205	247	\N	29	15	100	19094	2.584715e+06	2.584815e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:26:38.179675	\N	\N	f
3158	2026-05-27	17:20:00	13569	65	228	268	\N	29	15	100	3771	2.584815e+06	2.584915e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 18:27:25.967922	\N	\N	f
3160	2026-05-27	08:16:00	13573	65	250	271	\N	29	15	160	\N	2.586686e+06	2.586846e+06	patio	normal	40 litros R04\n60 litros Ex08\n70 litros Planta verde	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:03:20.240342	\N	\N	f
3161	2026-05-28	22:20:00	13574	65	242	252	\N	29	15	80	45979	2.586846e+06	2.586926e+06	patio	normal	recorridos 100km de la ultima carga	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:08:18.123844	\N	\N	f
3163	2026-05-28	23:40:00	13576	65	209	251	\N	29	15	90	42393	2.587008e+06	2.587098e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:09:19.666588	\N	\N	f
3164	2026-05-28	18:07:00	11682	65	198	241	146	30	16	100	79516	924552	924652	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:17:04.991388	\N	241	f
3165	2026-05-28	18:17:00	11683	65	202	244	146	30	16	100	67697	924652	924752	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:19:21.838845	\N	244	f
3166	2026-05-28	18:21:00	11684	65	199	242	146	30	16	80	136845	924752	924832	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:19:57.535099	\N	242	f
3167	2026-05-28	18:26:00	11685	65	203	272	146	30	16	80	127120	924832	924912	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:20:42.422081	\N	272	f
3168	2026-05-28	21:54:00	11686	65	230	262	144	30	16	300	4318	924912	925212	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:21:57.192673	\N	262	f
3169	2026-05-28	11:15:00	11687	65	216	259	138	30	16	60	5286	925212	925272	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:22:41.615239	\N	259	f
3170	2026-05-28	23:21:00	11688	65	219	\N	138	30	16	20	2769	925272	925292	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:24:48.9429	\N	\N	f
3171	2026-05-28	00:35:00	11689	65	221	278	139	30	16	91	6902	925293	925384	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:27:47.512945	\N	278	f
3172	2026-05-28	13:10:00	11690	65	220	\N	139	30	16	43	19051	925384	925427	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:28:44.561596	\N	\N	t
3173	2026-05-28	13:30:00	11691	65	236	\N	139	30	16	26	1354	925427	925453	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 21:30:57.142063	\N	\N	f
3174	2026-05-28	21:24:00	11692	65	208	250	145	30	16	100	1.030977e+06	925453	925553	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 03:29:11.234286	253	250	f
3175	2026-05-28	21:29:00	11693	65	211	254	145	30	16	100	34281	925553	925653	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 03:30:49.453697	253	254	f
3159	2026-05-27	18:50:00	13571	65	206	248	\N	29	15	100	516946	2.585458e+06	2.585558e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-28 20:16:19.924771	\N	\N	t
3176	2026-05-29	08:14:00	11694	65	202	244	146	30	16	50	67958	925653	925703	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 14:17:44.839177	253	244	f
3177	2026-05-29	08:17:00	11695	65	201	243	146	30	16	80	15143	925703	925783	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 14:19:53.578261	253	243	f
3178	2026-05-29	08:19:00	11696	65	209	251	146	30	16	50	42552	925783	925833	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 14:22:16.647431	253	251	f
3179	2026-05-29	08:22:00	11697	65	212	273	146	30	16	50	46588	925833	925883	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 14:24:04.135928	253	273	f
3180	2026-05-29	08:24:00	11698	65	198	241	146	30	16	60	79701	925883	925943	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 14:26:20.932908	253	241	f
3181	2026-05-29	11:10:00	118500	65	199	242	157	30	16	80	137113	925943	926023	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 17:19:41.332544	\N	242	f
3182	2026-05-28	16:30:00	13577	65	226	266	\N	29	15	100	52722	2.587099e+06	2.587199e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 17:39:44.478666	\N	\N	f
3183	2026-05-28	16:41:00	13578	65	214	257	\N	29	15	80	65454	2.587199e+06	2.587279e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 17:54:29.212315	\N	\N	f
3184	2026-05-28	16:47:00	13579	65	215	258	\N	29	15	80	46801	2.587279e+06	2.587359e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 17:55:06.226839	\N	\N	f
3185	2026-05-28	16:58:00	13580	65	213	256	\N	29	15	100	1.368845e+06	2.587359e+06	2.587459e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 17:55:43.414231	\N	\N	f
3186	2026-05-28	17:05:00	13581	65	232	267	\N	29	15	80	478540	2.587459e+06	2.587539e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 17:56:48.806717	\N	\N	f
3187	2026-05-28	17:13:00	13582	65	228	268	\N	29	15	100	4007	2.587539e+06	2.587639e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 17:57:20.52954	\N	\N	f
3188	2026-05-28	17:30:00	13583	65	204	246	\N	29	15	100	442155	2.58764e+06	2.58774e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 17:58:59.45293	\N	\N	f
3189	2026-05-28	17:40:00	13584	65	205	247	\N	29	15	80	19279	2.58774e+06	2.58782e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 17:59:30.533172	\N	\N	f
3190	2026-05-28	17:50:00	13585	65	229	269	\N	29	15	100	789547	2.58782e+06	2.58792e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 18:00:17.191113	\N	\N	f
3191	2026-05-28	18:00:00	13586	65	242	252	\N	29	15	80	46117	2.58792e+06	2.588e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 18:00:50.598606	\N	\N	f
3192	2026-05-28	18:10:00	13587	65	206	248	\N	29	15	100	517254	2.588e+06	2.5881e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 18:01:22.810505	\N	\N	f
3193	2026-05-29	12:59:00	118501	65	203	272	145	30	16	100	127477	926023	926123	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 19:18:46.629178	253	272	f
3194	2026-05-29	15:00:00	118502	65	232	267	143	30	16	50	478816	926123	926173	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 21:01:49.087216	253	267	f
3195	2026-05-27	\N	\N	65	240	\N	154	31	\N	60	\N	\N	\N	externo	normal	[HILUX] NOTA 13573 HILUX DE TALLER	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 22:37:50.53621	\N	\N	f
3196	2026-05-29	16:54:00	118503	65	211	254	167	30	16	30	34471	926173	926203	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 22:57:11.175134	253	254	f
3198	2026-05-29	16:57:00	118504	65	228	268	167	30	16	72	4225	926203	926275	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-29 22:58:32.980897	253	268	f
3199	2026-05-27	\N	\N	65	241	\N	154	31	\N	70	\N	\N	\N	externo	normal	[HILUX] HILUX FOLIO 13573	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 22:58:48.846766	\N	\N	f
3200	2026-05-27	\N	\N	65	233	\N	154	31	\N	40	1488	\N	\N	externo	normal	[HILUX] HILUX FOLIO 13573	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 23:00:11.087158	\N	\N	f
3214	2026-05-30	00:00:00	13602	66	206	248	\N	29	15	50	517510	2.589903e+06	2.589953e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:12:15.115991	\N	\N	f
3202	2026-05-29	13:10:00	13590	65	209	251	\N	29	15	40	42685	2.589265e+06	2.589305e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 23:13:05.464869	\N	\N	f
3203	2026-05-29	14:25:00	13591	65	240	274	\N	29	15	60	11259	2.589305e+06	2.589365e+06	patio	normal	PASA ARQ JOSE POR 3 YOGAS PARA MARAVILLAS	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 23:15:10.558125	\N	\N	f
3201	2026-05-29	08:50:00	13589	65	233	239	\N	29	15	40	1512	2.589225e+06	2.589265e+06	patio	normal	SE MANDAN 40LT A MARAVILLAS EN BOTES	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-29 23:11:35.836476	\N	\N	f
3204	2026-05-29	16:46:00	13592	65	215	258	\N	29	15	50	47080	2.589364e+06	2.589414e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 01:15:52.189409	\N	\N	f
3205	2026-05-29	16:53:00	13593	65	226	266	\N	29	15	40	53058	2.589414e+06	2.589454e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 01:16:50.091302	\N	\N	f
3206	2026-05-29	17:00:00	13594	65	213	256	\N	29	15	5	1.3691e+06	2.589455e+06	2.58946e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 01:18:49.125712	\N	\N	f
3207	2026-05-30	00:00:00	13595	66	213	256	\N	29	15	100	1.3691e+06	2.58946e+06	2.58956e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, RESERVA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 01:19:22.176326	\N	\N	f
3208	2026-05-29	17:08:00	13596	65	204	246	\N	29	15	120	442433	2.58956e+06	2.58968e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 01:21:10.564084	\N	\N	f
3209	2026-05-29	17:12:00	13597	65	214	257	\N	29	15	1	65681	2.58968e+06	2.589681e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 01:21:43.575086	\N	\N	f
3210	2026-05-30	00:00:00	13598	66	214	257	\N	29	15	100	65681	2.589681e+06	2.589781e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, RESERVA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 01:22:11.528647	\N	\N	f
3211	2026-05-29	17:22:00	13599	65	242	252	\N	29	15	1	46117	2.589781e+06	2.589782e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 01:23:37.223638	\N	\N	f
3212	2026-05-30	00:00:00	13600	66	242	252	\N	29	15	100	46117	2.589779e+06	2.589879e+06	patio	normal	CARGA POSTFECHADA P SABADO, HUBODOMETRO NUEVO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 01:24:08.010864	\N	\N	f
3213	2026-05-29	17:37:00	13601	65	206	248	\N	29	15	20	517510	2.589883e+06	2.589903e+06	patio	normal	SE CAMBIAN LLANTAS POS 9 Y 10 POR GALLITOS EXISTENTES 22"	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:02:51.48259	\N	\N	f
3216	2026-05-29	09:17:00	11699	65	245	240	146	30	16	60	561895	925943	926003	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:18:22.883064	\N	240	f
3217	2026-05-29	\N	\N	65	203	272	162	31	\N	1	127566	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:31:36.672696	\N	\N	f
3218	2026-05-29	\N	\N	65	199	242	162	31	\N	1	137212	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:32:40.428627	\N	\N	f
3219	2026-05-29	\N	\N	65	232	267	162	31	\N	1	478844	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:37:22.376785	\N	\N	f
3220	2026-05-29	\N	\N	65	208	\N	162	31	\N	1	1.031193e+06	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:40:17.767404	\N	\N	f
3223	2026-05-29	\N	\N	65	211	\N	162	31	\N	1	34498	\N	\N	externo	normal	[Externo] corte	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:50:53.872772	\N	\N	f
3221	2026-05-29	\N	\N	65	209	251	162	31	\N	1	42813	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:41:03.103819	\N	\N	f
3222	2026-05-29	\N	\N	65	198	241	162	31	\N	1	79879	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:45:28.344583	\N	\N	f
3224	2026-05-30	12:04:00	118505	66	211	254	160	30	16	100	34509	926336	926436	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-30 18:06:53.056239	253	254	f
3225	2026-05-30	12:06:00	118506	66	212	255	145	30	16	100	46855	926436	926536	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-30 18:08:17.109588	253	255	f
3227	2026-05-30	12:09:00	118508	66	202	244	146	30	16	100	68158	926636	926736	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-30 18:12:16.569626	253	244	f
3228	2026-05-30	12:12:00	118509	66	232	267	146	30	16	100	478881	926736	926836	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-30 18:14:12.919467	253	267	f
3229	2026-05-30	12:14:00	118510	66	208	250	146	30	16	100	1.031202e+06	926836	926936	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-30 18:17:17.471597	253	250	f
3230	2026-05-30	12:17:00	118511	66	198	241	146	30	16	150	79890	926936	927086	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-30 18:18:50.599024	253	241	f
3231	2026-05-30	12:18:00	118512	66	230	262	144	30	16	324	4336	927086	927410	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-30 18:20:30.134093	253	262	f
3232	2026-05-30	08:20:00	13605	66	209	251	\N	29	15	100	42819	2.590755e+06	2.590855e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 13:52:56.100687	\N	\N	f
3233	2026-05-30	11:40:00	13606	66	251	239	\N	29	15	32	\N	2.590855e+06	2.590887e+06	patio	normal	SALE  A MARAVILLAS	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 13:55:17.580067	\N	\N	f
3234	2026-05-30	00:52:00	13607	66	242	252	\N	29	15	40	46117	2.590887e+06	2.590927e+06	patio	normal	KILOMETROS REALES 101 ( HUBODOMETRO NUEVO )	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 13:56:57.148231	\N	\N	f
3235	2026-05-30	00:55:00	13608	66	203	242	\N	29	15	120	127709	2.590927e+06	2.591047e+06	patio	normal	CHUY DEJA 31 TOMA 30	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 13:57:51.026318	\N	\N	f
3236	2026-06-01	07:56:00	118513	66	228	268	160	30	16	100	4482	927410	927510	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 13:58:37.338394	253	268	f
3237	2026-05-30	13:05:00	13609	66	211	254	\N	29	15	60	34601	2.591048e+06	2.591108e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 14:03:48.650309	\N	\N	f
3239	2026-05-30	13:25:00	13611	66	252	272	\N	29	15	120	471	2.591208e+06	2.591328e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 14:06:08.966306	\N	\N	f
3240	2026-06-01	08:03:00	118514	66	244	253	163	30	16	65	150391	927510	927575	campo	normal	 Km 155203 tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 14:06:17.18657	253	253	t
3241	2026-05-30	14:00:00	13612	66	204	246	\N	29	15	80	442616	2.591329e+06	2.591409e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 14:08:13.268234	\N	\N	f
3242	2026-06-01	08:06:00	11864	66	214	257	145	30	16	100	65888	927575	927675	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 14:08:47.554413	253	257	f
3243	2026-05-30	14:15:00	13613	66	206	248	\N	29	15	100	517672	2.591409e+06	2.591509e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 14:09:03.341988	\N	\N	f
3244	2026-05-30	14:20:00	13614	66	208	250	\N	29	15	100	1.031378e+06	2.591509e+06	2.591609e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 14:10:08.534448	\N	\N	f
3245	2026-06-01	08:08:00	11866	66	213	256	145	30	16	100	1.36925e+06	927675	927775	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 14:10:45.064382	253	256	f
3226	2026-05-30	12:08:00	118507	66	226	266	145	30	16	100	53082	926536	926636	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-05-30 18:09:52.931342	253	266	f
3246	2026-06-01	08:25:00	11867	66	226	266	145	30	16	100	53188	927775	927875	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 14:27:23.277012	253	266	f
3247	2026-06-01	08:27:00	118515	66	212	273	145	30	16	100	46879	927875	927975	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 14:28:59.861573	253	273	f
3248	2026-06-01	08:28:00	11869	66	202	244	146	30	16	100	68361	927975	928075	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 14:30:33.205624	253	244	f
3249	2026-06-01	08:30:00	11870	66	209	251	146	30	16	100	42985	928075	928175	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 14:32:10.78697	253	251	f
3250	2026-06-01	07:40:00	13616	66	197	240	\N	29	15	120	23308	2.592722e+06	2.592842e+06	patio	normal	ARRANCA CON LAGARTOS NUEVOS, BUJES NUEVOS, MUELLES DELANTERAS NUEVAS REFORZADAS, SE ATENDIERON DETALLES EN SU TOTALIDAD	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 17:40:41.342411	\N	\N	f
3251	2026-06-01	10:07:00	13617	66	199	258	\N	29	15	150	137320	2.592842e+06	2.592992e+06	patio	normal	SE LLEVA VICTOR MARCIAL CAMION, CA06 EN AGENCIA KW SANTA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-01 17:41:19.020558	\N	\N	f
3253	2026-06-01	17:14:00	118516	66	241	253	154	30	16	40	19345	928225	928265	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 23:17:35.99106	253	253	f
3254	2026-06-01	17:17:00	11880	66	233	264	154	30	16	94	1524	928265	928359	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 23:19:13.853565	253	264	f
3255	2026-06-01	17:19:00	11881	66	216	259	138	30	16	60	5296	928359	928419	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 23:25:08.541528	253	259	f
3256	2026-06-01	17:28:00	11882	66	234	271	168	30	16	359	3699.1	928419	928778	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-01 23:31:32.392388	253	271	f
3257	2026-06-01	11:14:00	13619	66	242	252	\N	29	15	100	46117	2.59377e+06	2.59387e+06	patio	normal	Kilometraje 223 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 13:15:20.650511	\N	\N	f
3258	2026-06-01	16:25:00	13620	66	205	247	\N	29	15	100	19414	2.59387e+06	2.59397e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 13:16:04.879315	\N	\N	f
3259	2026-06-01	16:40:00	13621	66	211	254	\N	29	15	100	34784	2.59397e+06	2.59407e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 13:17:32.459743	\N	\N	f
3260	2026-06-01	16:55:00	13622	66	206	248	\N	29	15	100	517672	2.59407e+06	2.59417e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 13:30:51.386721	\N	\N	t
3261	2026-06-01	05:40:00	13623	66	228	268	\N	29	15	100	4687	2.59417e+06	2.59427e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 13:31:23.062226	\N	\N	f
3262	2026-06-01	17:55:00	13624	66	204	246	\N	29	15	100	442840	2.594271e+06	2.594371e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 13:32:16.874122	\N	\N	f
3263	2026-06-02	07:38:00	11883	66	212	273	143	30	16	100	47178	928778	928878	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 13:40:30.373229	253	273	f
3264	2026-06-02	07:40:00	11884	66	226	266	143	30	16	150	53394	928878	929028	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 13:43:27.089471	253	266	f
3265	2026-06-02	07:43:00	11885	66	232	267	143	30	16	100	479123	929028	929128	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 13:48:36.489787	253	267	f
3268	2026-06-01	11:37:00	11878	66	240	274	154	30	16	50	11266	928177	928227	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 14:01:47.648725	\N	274	f
3269	2026-06-02	09:14:00	11888	66	252	272	167	30	16	150	724	928227	928377	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 15:16:13.97763	253	272	f
3270	2026-06-02	09:16:00	11889	66	208	250	167	30	16	120	1.031636e+06	928377	928497	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 15:28:07.408181	253	250	f
3267	2026-06-02	07:50:00	11887	66	209	251	143	30	16	40	43193	929228	929268	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 13:52:27.893329	253	251	f
3271	2026-06-02	10:23:00	11890	66	198	241	146	30	16	100	80219	928497	928597	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 16:25:25.219496	253	241	f
3272	2026-06-02	10:25:00	11891	66	213	256	146	30	16	100	1.369461e+06	928597	928697	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 16:27:04.666819	253	256	f
3273	2026-06-01	18:15:00	13625	66	229	269	\N	29	15	100	790178	2.594371e+06	2.594471e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 18:08:45.030315	\N	\N	f
3274	2026-06-02	20:26:00	13627	66	214	257	\N	29	15	150	66088	2.594936e+06	2.595086e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 18:09:27.752322	\N	\N	f
3275	2026-06-02	14:32:00	11892	66	209	251	169	30	16	60	43296	928697	928757	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 20:35:28.212908	253	251	f
3276	2026-06-02	14:35:00	11893	66	197	240	157	30	16	100	23600	928757	928857	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 20:37:19.625174	253	240	f
3277	2026-06-02	14:26:00	11894	66	242	252	157	30	16	50	46117	929901	929951	campo	normal	kilometraje real: 434	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-02 21:20:58.231553	\N	252	f
3278	2026-06-02	15:36:00	11895	66	204	246	157	30	16	80	443039	929951	930031	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 21:41:47.036312	253	246	f
3266	2026-06-02	07:48:00	11886	66	202	244	143	30	16	100	68586	929128	929228	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-02 13:50:08.916341	253	244	f
3279	2026-06-02	14:30:00	13629	66	203	242	\N	29	15	120	128079	2.595785e+06	2.595905e+06	patio	normal	1 UREA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 00:03:19.929572	\N	\N	f
3280	2026-06-02	16:00:00	13630	66	211	254	\N	29	15	100	34950	2.595905e+06	2.596005e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 00:03:45.822045	\N	\N	f
3281	2026-06-02	16:04:00	13631	66	229	269	\N	29	15	100	790402	2.596006e+06	2.596106e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 00:04:47.906917	\N	\N	f
3282	2026-06-02	17:38:00	13632	66	199	258	\N	29	15	100	137685	2.596106e+06	2.596206e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 00:05:39.755924	\N	\N	f
3283	2026-06-02	17:00:00	13633	66	205	247	\N	29	15	80	19631	2.596206e+06	2.596286e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 00:06:08.639146	\N	\N	f
3284	2026-06-02	17:09:00	13634	66	242	252	\N	29	15	80	46117	2.596286e+06	2.596366e+06	patio	normal	KILOMETRAJE REAL 479	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 00:07:13.984305	\N	\N	f
3285	2026-06-02	17:23:00	13635	66	209	251	\N	29	15	80	43374	2.596367e+06	2.596447e+06	patio	normal	SE CARGA 80 LITROS PARA ROMPER EL CICLO DE CARGA EN CALLE , PARA QUE ACABE EL DIA MIERCOLES SIN PROBLEMA Y RELLENE EN TALLER	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 00:08:08.652031	\N	\N	f
3286	2026-06-02	17:00:00	13636	66	206	248	\N	29	15	100	518079	2.596447e+06	2.596547e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 00:08:40.919995	\N	\N	f
3287	2026-06-03	08:12:00	11896	66	230	262	144	30	16	280	4356	930031	930311	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-03 14:32:08.745508	253	262	f
3288	2026-06-02	18:02:00	13637	66	202	244	\N	29	15	100	68800	2.596547e+06	2.596647e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 17:15:42.032525	\N	\N	f
3289	2026-06-02	18:07:00	13638	66	212	255	\N	29	15	100	47377	2.596646e+06	2.596746e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 17:16:08.269253	\N	\N	f
3290	2026-06-02	18:26:00	13639	66	228	268	\N	29	15	100	4969	2.596747e+06	2.596847e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 17:17:18.532275	\N	\N	f
3291	2026-06-03	08:10:00	13640	66	227	239	\N	29	15	60	452560	2.596847e+06	2.596907e+06	patio	normal	SALE CON MARTIN ELIZONDO PARA DIAGNOSTICO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 17:17:46.032943	\N	\N	f
3292	2026-06-03	10:50:00	13641	66	203	242	\N	29	15	70	128239	2.596909e+06	2.596979e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 17:20:44.506603	\N	\N	f
3293	2026-06-03	10:56:00	13642	66	252	272	\N	29	15	80	944	2.596979e+06	2.597059e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 17:21:11.816456	\N	\N	f
3294	2026-06-03	15:00:00	11897	66	197	240	145	30	16	100	23838	930311	930411	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-03 21:02:46.104139	253	240	f
3295	2026-06-03	13:34:00	13643	66	242	252	\N	29	15	110	46117	2.597059e+06	2.597169e+06	patio	normal	kilos reales  683	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 23:32:54.931394	\N	\N	f
3296	2026-06-03	15:40:00	13644	66	213	256	\N	29	15	100	1.369677e+06	2.59717e+06	2.59727e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 23:33:28.072331	\N	\N	f
3297	2026-06-03	16:35:00	13645	66	229	269	\N	29	15	90	790603	2.59727e+06	2.59736e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 23:36:23.004868	\N	\N	f
3298	2026-06-03	16:48:00	13646	66	232	267	\N	29	15	90	479501	2.59736e+06	2.59745e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 23:37:00.744048	\N	\N	f
3299	2026-06-03	16:52:00	13647	66	226	266	\N	29	15	110	53826	2.597452e+06	2.597562e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 23:37:44.776407	\N	\N	f
3300	2026-06-03	17:16:00	13648	66	199	258	\N	29	15	50	137926	2.597562e+06	2.597612e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 23:38:06.391198	\N	\N	f
3301	2026-06-03	17:38:00	13649	66	214	257	\N	29	15	100	66485	2.597612e+06	2.597712e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 23:52:07.252984	\N	\N	f
3302	2026-06-03	17:46:00	13650	66	208	250	\N	29	15	100	1.031636e+06	2.597712e+06	2.597812e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-03 23:53:21.368109	\N	\N	t
3303	2026-06-03	17:50:00	13651	66	211	254	\N	29	15	90	35166	2.597813e+06	2.597903e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-04 00:51:35.036253	\N	\N	f
3304	2026-06-03	18:01:00	13652	66	205	247	\N	29	15	80	19852	2.597903e+06	2.597983e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-04 00:54:26.610683	\N	\N	f
3305	2026-06-03	18:14:00	13653	66	212	255	\N	29	15	100	47630	2.597983e+06	2.598083e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-04 00:58:03.354361	\N	\N	f
3306	2026-06-03	18:21:00	13654	66	228	268	\N	29	15	90	5260	2.598083e+06	2.598173e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-04 00:59:02.676753	\N	\N	f
3307	2026-06-03	18:35:00	13655	66	209	251	\N	29	15	90	43672	2.598173e+06	2.598263e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-04 00:59:53.652433	\N	\N	f
3308	2026-06-04	08:25:00	11898	66	198	241	146	30	16	100	80524	930411	930511	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-04 14:27:25.229378	253	241	f
3309	2026-06-04	08:27:00	11899	66	202	244	146	30	16	100	69159	930511	930611	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-04 14:29:12.594392	253	244	f
3310	2026-06-03	18:45:00	13656	66	204	246	\N	29	15	120	443559	2.598264e+06	2.598384e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-04 14:57:17.902595	\N	\N	f
3311	2026-06-03	18:54:00	13657	66	206	248	\N	29	15	110	518399	2.598384e+06	2.598494e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-04 14:57:55.314086	\N	\N	f
3312	2026-06-04	12:57:00	11900	66	197	240	157	30	16	100	24022	930611	930711	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-04 18:59:11.362542	253	240	f
3313	2026-06-04	12:59:00	11901	66	252	272	157	30	16	110	1249	930711	930821	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-04 19:00:35.691485	253	272	f
3314	2026-06-04	14:23:00	11902	66	203	242	137	30	16	100	128532	930821	930921	campo	normal	Finalizo carga de nissan tanque vacio	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-04 20:25:20.43106	253	242	f
3215	2026-05-29	21:12:00	13603	66	229	269	\N	29	15	100	789777	2.589953e+06	2.590053e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:13:23.887557	\N	\N	f
3315	2026-06-04	08:27:00	13659	66	250	239	\N	29	15	100	1	2.598896e+06	2.598996e+06	patio	normal	Sale con diésel para allende , pruebas de camiones \nSe descargaron solo 20 litros. , restan 80 en Hilux 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:16:15.353488	\N	\N	f
3316	2026-06-04	21:15:00	13660	66	240	239	\N	29	15	60	11266	2.598996e+06	2.599056e+06	patio	normal	Horometro pendiente, juanra cargo en yogas 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:17:27.905403	\N	\N	f
3317	2026-06-04	14:50:00	13661	66	213	256	\N	29	15	100	1.369677e+06	2.599156e+06	2.599256e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:18:30.742924	\N	\N	t
3318	2026-06-04	16:55:00	13663	66	209	251	\N	29	15	75	43870	2.599756e+06	2.599831e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:20:08.470136	\N	\N	f
3319	2026-06-04	17:05:00	13664	66	226	266	\N	29	15	90	54147	2.599831e+06	2.599921e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:22:49.381144	\N	\N	f
3321	2026-06-04	17:25:00	13666	66	232	267	\N	29	15	80	479771	2.599992e+06	2.600072e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:24:53.855012	\N	\N	f
3323	2026-06-04	17:47:00	13668	66	205	247	\N	29	15	90	20063	2.600132e+06	2.600222e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:26:51.905199	\N	\N	f
3324	2026-06-04	18:05:00	13669	66	206	248	\N	29	15	90	518636	2.600223e+06	2.600313e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:28:17.85355	\N	\N	f
3325	2026-06-04	18:06:00	13670	66	204	246	\N	29	15	120	443671	2.600313e+06	2.600433e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:29:48.130467	\N	\N	f
3320	2026-06-04	17:13:00	13665	66	214	257	\N	29	15	70	66803	2.599922e+06	2.599992e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:24:05.59196	\N	\N	f
3322	2026-06-04	17:36:00	13667	66	242	252	\N	29	15	60	46117	2.600072e+06	2.600132e+06	patio	normal	Kilómetros reales 880	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:26:02.469257	\N	\N	f
3326	2026-06-04	18:15:00	13671	66	202	244	\N	29	15	50	69386	2.600433e+06	2.600483e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:49:46.662622	\N	\N	f
3327	2026-06-04	18:27:00	13672	66	229	269	\N	29	15	110	790928	2.600483e+06	2.600593e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:50:56.11279	\N	\N	f
3329	2026-06-05	06:58:00	11903	66	216	\N	138	30	16	60	5308	930921	930981	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-05 13:01:02.950634	\N	\N	f
3330	2026-06-05	09:43:00	11904	66	230	262	144	30	16	297	4373	930981	931278	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-05 15:46:13.142725	253	262	f
3331	2026-06-05	11:02:00	11905	66	208	250	\N	30	16	80	1.032063e+06	931278	931358	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-05 17:04:09.331713	253	250	f
3332	2026-06-05	11:42:00	11906	66	242	252	143	30	16	60	46118	931360	931420	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 17:43:28.723683	\N	252	f
3333	2026-06-04	18:41:00	13674	66	228	268	\N	29	15	100	5510	2.600672e+06	2.600772e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 19:34:53.000168	\N	\N	f
3334	2026-06-04	19:01:00	13675	66	212	255	\N	29	15	70	47945	2.600774e+06	2.600844e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 19:35:27.687954	\N	\N	f
3335	2026-06-05	08:10:00	13676	66	253	239	\N	29	15	60	3629	2.600844e+06	2.600904e+06	patio	normal	SALE A VALLE REAL SE INTERCAMBIA POR M03	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 19:41:21.798076	\N	\N	f
3336	2026-06-05	10:40:00	131228	66	254	239	\N	29	15	40	\N	2.600904e+06	2.600944e+06	patio	normal	40 LITROS PARA MOVER CAMION DE ALLENDE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 19:44:38.436619	\N	\N	f
3328	2026-06-04	18:35:00	13673	66	211	254	\N	29	15	80	35342	2.600593e+06	2.600673e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 00:52:52.614378	\N	\N	f
3337	2026-06-05	17:46:00	11907	66	211	254	145	30	16	20	35482	931420	931440	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-05 23:47:52.636659	253	254	f
3338	2026-06-05	17:47:00	11908	66	214	257	143	30	16	30	67057	931440	931470	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-05 23:49:36.536598	253	257	f
3339	2026-06-05	17:49:00	11909	66	252	272	143	30	16	90	1617	931470	931560	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-05 23:51:06.331647	253	272	f
3340	2026-06-05	17:51:00	11910	66	212	255	170	30	16	70	48181	931560	931630	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-05 23:54:09.395425	253	255	f
3341	2026-06-05	16:16:00	13679	66	213	256	\N	29	15	5	1.370077e+06	2.601442e+06	2.601447e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 23:58:02.760188	\N	\N	f
3342	2026-06-06	00:58:00	13680	67	213	256	\N	29	15	100	1.370077e+06	2.601447e+06	2.601547e+06	patio	normal	Carga POSTFECHADA para sábado , nivel muy bajo 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-05 23:59:19.418209	\N	\N	f
3343	2026-06-05	\N	\N	66	211	\N	162	31	\N	1	35522	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 00:02:08.67096	\N	\N	f
3344	2026-06-06	00:02:00	13681	67	211	254	\N	29	15	100	35522	2.601547e+06	2.601647e+06	patio	normal	Postfechado para sábado 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 00:03:13.144582	\N	\N	f
3345	2026-06-05	16:50:00	13682	66	229	269	\N	29	15	100	791200	2.601647e+06	2.601747e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 00:05:04.530772	\N	\N	f
3346	2026-06-05	17:11:00	13683	66	209	251	\N	29	15	1	44129	2.601747e+06	2.601748e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 00:07:14.27383	\N	\N	f
3348	2026-06-05	\N	\N	66	197	\N	162	31	\N	1	24459	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 00:11:28.203717	\N	\N	f
3349	2026-06-06	00:00:00	13685	67	197	240	\N	29	15	100	24459	2.601827e+06	2.601927e+06	patio	normal	Carga postfechada sábado 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 00:12:49.427009	\N	\N	f
3350	2026-06-05	17:40:00	13686	66	205	247	\N	29	15	20	20293	2.601927e+06	2.601947e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 00:14:42.798427	\N	\N	f
3351	2026-06-06	00:00:00	13687	67	205	247	\N	29	15	50	20293	2.601948e+06	2.601998e+06	patio	normal	Carga postfechada sábado 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 00:16:46.145476	\N	\N	f
3352	2026-06-05	17:50:00	13688	66	232	267	\N	29	15	30	480058	2.601999e+06	2.602029e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 00:17:45.026385	\N	\N	f
3353	2026-06-05	17:56:00	13689	66	226	266	\N	29	15	60	54435	2.602029e+06	2.602089e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:21:15.024282	\N	\N	f
3354	2026-06-06	00:00:00	13690	67	226	266	\N	29	15	80	54435	2.602089e+06	2.602169e+06	patio	normal	NOTA POSTFECHADA, CAMION CON 140 LITROS QUEDA ABAJITO DE MEDIO TANQUE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:23:29.140852	\N	\N	f
3355	2026-06-05	18:08:00	13691	66	202	244	\N	29	15	70	69781	2.602169e+06	2.602239e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:24:00.446353	\N	\N	f
3356	2026-06-05	18:23:00	13692	66	228	268	\N	29	15	90	5738	2.60224e+06	2.60233e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:28:01.571716	\N	\N	f
3357	2026-06-05	18:34:00	13693	66	242	252	\N	29	15	1	46118	2.60233e+06	2.602331e+06	patio	normal	kms reales 1155	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:29:04.788503	\N	\N	f
3358	2026-06-06	00:00:00	13694	67	242	252	\N	29	15	90	46119	2.602328e+06	2.602418e+06	patio	normal	CARGA POSTFECHADA , NIVEL DEMASIADO BAJO, CAMION CARGADO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:30:00.742982	\N	\N	f
3359	2026-06-05	18:46:00	13695	66	206	248	\N	29	15	1	518919	2.602421e+06	2.602422e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:31:13.870141	\N	\N	f
3360	2026-06-06	12:00:00	13696	67	206	248	\N	29	15	100	518919	2.602422e+06	2.602522e+06	patio	normal	CARGA POSTFECHADA, NIVEL DEMASIADO BAJO 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:32:00.689058	\N	\N	f
3361	2026-06-05	18:59:00	13697	66	199	258	\N	29	15	60	138357	2.602522e+06	2.602582e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:32:54.84727	\N	\N	f
3362	2026-06-06	12:00:00	13698	67	199	258	\N	29	15	50	138357	2.602582e+06	2.602632e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:33:17.944847	\N	\N	f
3363	2026-06-05	19:07:00	13699	66	204	246	\N	29	15	100	443941	2.602632e+06	2.602732e+06	patio	normal	BUEN RENDIMIENTO, NO CARGA SABADO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 01:34:13.98364	\N	\N	f
3364	2026-06-06	07:02:00	11911	67	202	244	146	30	16	100	69829	931630	931730	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-06 13:04:11.057406	253	244	f
3365	2026-06-06	07:04:00	11912	67	198	241	146	30	16	150	80867	931730	931880	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-06 13:05:34.883483	253	241	f
3366	2026-06-05	\N	\N	66	208	\N	162	31	\N	1	1.032201e+06	\N	\N	externo	normal	[Externo] CORTE KMS	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 16:09:40.183818	\N	\N	f
3368	2026-06-05	\N	\N	66	198	\N	162	31	\N	1	80855	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 16:28:51.19288	\N	\N	f
3369	2026-06-05	\N	\N	66	252	\N	162	31	\N	1	1639	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 17:02:55.287711	\N	\N	f
3370	2026-06-05	\N	\N	66	203	\N	162	31	\N	1	128827	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 17:43:45.910686	\N	\N	f
3371	2026-06-06	23:00:00	13700	67	214	257	\N	29	15	70	67164	2.602732e+06	2.602802e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:12:03.897888	\N	\N	f
3372	2026-06-06	11:10:00	13701	67	212	255	\N	29	15	70	48316	2.602802e+06	2.602872e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:14:18.341915	\N	\N	f
3373	2026-06-06	11:23:00	13702	67	252	272	\N	29	15	70	1808	2.602872e+06	2.602942e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:14:47.714309	\N	\N	f
3374	2026-06-06	11:35:00	13703	67	197	240	\N	29	15	70	24570	2.602942e+06	2.603012e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:15:27.458415	\N	\N	f
3375	2026-06-06	11:49:00	13704	67	254	239	\N	29	15	40	476767	2.603012e+06	2.603052e+06	patio	normal	RC58811A	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:16:12.313385	\N	\N	f
3376	2026-06-06	12:05:00	13705	67	208	250	\N	29	15	70	1.032291e+06	2.603052e+06	2.603122e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:16:57.792356	\N	\N	f
3377	2026-06-06	12:19:00	13706	67	206	248	\N	29	15	70	519061	2.603122e+06	2.603192e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:42:55.613737	\N	\N	f
3378	2026-06-06	12:50:00	13707	67	242	252	\N	29	15	70	46119	2.603192e+06	2.603262e+06	patio	normal	KILOMETRAJE REAL 1291	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:43:26.189318	\N	\N	f
3379	2026-06-06	12:56:00	13708	67	203	242	\N	29	15	70	128853	2.603263e+06	2.603333e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:43:59.126301	\N	\N	f
3380	2026-06-06	13:10:00	13709	67	204	246	\N	29	15	70	444120	2.603333e+06	2.603403e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:44:23.509725	\N	\N	f
3381	2026-06-06	13:16:00	13710	67	211	254	\N	29	15	70	35707	2.603403e+06	2.603473e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:45:02.427323	\N	\N	f
3382	2026-06-06	13:23:00	13711	67	201	243	\N	29	15	70	15280	2.603472e+06	2.603542e+06	patio	normal	REGRESA DE VACAS CHOFER	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:45:42.951003	\N	\N	f
3383	2026-06-06	13:32:00	13712	67	209	251	\N	29	15	70	44263	2.603542e+06	2.603612e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 19:47:21.267388	\N	\N	f
3384	2026-06-06	13:42:00	13713	67	226	266	\N	29	15	70	54630	2.603612e+06	2.603682e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 20:46:36.473902	\N	\N	f
3385	2026-06-06	13:51:00	13714	67	205	247	\N	29	15	70	20474	2.603682e+06	2.603752e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 20:47:11.270921	\N	\N	f
3386	2026-06-06	13:59:00	13715	67	229	269	\N	29	15	18	791402	2.603753e+06	2.603771e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 20:48:48.284013	\N	\N	f
3387	2026-06-06	\N	\N	67	245	\N	163	31	\N	60	562086	\N	\N	externo	normal	[OXXOGAS] CARGA MARGARITO DIESEL DE OXXO GAS, CUENTALITROS: 931880 - 931941, FOLIO 11913\nFOLIO OXXO GAS: 442527960	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 20:20:02.173442	\N	\N	f
3388	2026-06-06	\N	\N	67	215	\N	163	31	\N	60	47235	\N	\N	externo	normal	[OXXOGAS] CARGA MAGO DIESEL OXXOGAS, CUENTALITROS: 931941 - 932001, FOLIO: 11914\nFOLIO OXXO GAS: 442527960	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 20:21:40.277432	\N	\N	f
3389	2026-06-06	\N	\N	67	229	\N	163	31	\N	60	791402	\N	\N	externo	normal	[OXXOGAS] CARGA MAGO DIESEL DE OXXOGAS FOLIO OXXO GAS: 442527960\nCUENTALITROS: 932001 - 932061, FOLIO: 11915	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 20:22:58.323143	\N	\N	f
3392	2026-06-08	\N	\N	67	234	\N	168	31	\N	207	3726	\N	\N	externo	normal	[OXXOGAS] CARGA MAGO DE OXXOGAS 185 LITROS, FOLIO 181263760, TENIA UN RESTO EL TANQUE, DANDO TOTAL DE 207 LT CARGADOS	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 20:56:16.071368	\N	\N	f
3393	2026-06-08	11:38:00	13717	67	199	266	\N	29	15	120	138573	2.603771e+06	2.603891e+06	patio	normal	AGARRA CHRISTOPHER CA31, DEJA EL 08 EN KENWORTH SANTA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 20:57:44.262521	\N	\N	f
3394	2026-06-08	14:30:00	13719	67	221	264	\N	29	15	30	6902	2.605023e+06	2.605053e+06	patio	normal	SE MANDAN 30 LITROS EN YOGA A MARAVILLAS  (JUANRA)	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 20:59:05.77581	\N	\N	f
3395	2026-06-08	\N	\N	67	221	\N	154	31	\N	10	\N	\N	\N	externo	normal	[SOBRANTE PIPA] SE MANDAN 10 LITROS SOBRANTES DE MANGUERA DE PIPA, SE LE MANDAN 40 LITROS EN TOTAL YA CON LA CARGA DE TALLER	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 20:59:51.363679	\N	\N	f
3396	2026-06-08	14:46:00	13720	67	242	252	\N	29	15	120	46120	2.605052e+06	2.605172e+06	patio	normal	Kilos reales: 1487	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 21:03:16.795008	\N	\N	f
3397	2026-06-08	15:04:00	13721	67	213	256	\N	29	15	120	1.3703e+06	2.605173e+06	2.605293e+06	patio	normal	AGUJA EN EL PISO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:14:16.113919	\N	\N	f
3398	2026-06-08	15:20:00	13722	67	245	279	\N	29	15	120	562126	2.605293e+06	2.605413e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:14:45.985585	\N	\N	f
3391	2026-06-06	\N	\N	67	232	\N	163	31	\N	80	480319	\N	\N	externo	normal	[OXXOGAS] CARGA MAGO DIESEL DE OXXOGAS ,FOLIO OXXO GAS: 442527960\nCUENTALITROS: 932122 - 932202, FOLIO 11917	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 20:25:40.833749	\N	\N	f
3399	2026-06-06	\N	\N	67	228	\N	163	31	\N	80	6000	\N	\N	externo	normal	[OXXOGAS] CARGA DIESEL DE OXXO GAS , TICKET:442527960\nCUENTALITROS 932122 - 932702 , FOLIO 11917	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:26:47.21382	\N	\N	f
3400	2026-06-08	15:40:00	13723	67	232	267	\N	29	15	120	480524	2.605413e+06	2.605533e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:33:14.480411	\N	\N	f
3401	2026-06-08	15:50:00	13724	67	228	268	\N	29	15	100	6201	2.605534e+06	2.605634e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:33:45.91537	\N	\N	f
3402	2026-06-08	16:15:00	13725	67	211	254	\N	29	15	120	35922	2.605634e+06	2.605754e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:34:13.317899	\N	\N	f
3403	2026-06-08	16:29:00	13726	67	206	248	\N	29	15	120	519320	2.605755e+06	2.605875e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:36:11.629102	\N	\N	f
3404	2026-06-08	16:37:00	13727	67	209	251	\N	29	15	120	44483	2.605875e+06	2.605995e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:37:42.023131	\N	\N	f
3405	2026-06-08	19:02:00	13728	67	205	247	\N	29	15	100	20741	2.605995e+06	2.606095e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:38:42.48517	\N	\N	f
3406	2026-06-08	15:53:00	11919	67	208	250	157	30	16	120	1.032481e+06	932409	932529	campo	normal	AGUJA EN EL PISO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:44:06.381281	\N	250	f
3407	2026-06-08	15:50:00	11920	67	214	257	157	30	16	100	67352	932409	932509	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:45:11.195547	\N	257	f
3408	2026-06-08	15:55:00	11921	67	202	244	157	30	16	100	70125	932629	932729	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:47:20.358803	\N	244	f
3409	2026-06-08	16:00:00	11922	67	201	243	157	30	16	100	15475	932730	932830	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:47:58.080421	\N	243	f
3410	2026-06-08	16:06:00	11923	67	198	241	157	30	16	100	81125	932830	932930	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:48:26.599869	\N	241	f
3411	2026-06-08	16:14:00	11924	67	212	255	157	30	16	100	48496	932930	933030	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:49:16.570489	\N	255	f
3412	2026-06-08	17:03:00	11925	67	197	240	157	30	16	120	24790	933032	933152	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:50:14.37125	\N	240	f
3413	2026-06-08	17:15:00	11926	67	252	272	163	30	16	150	2082	933152	933302	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:50:43.994435	\N	272	f
3414	2026-06-08	17:49:00	11927	67	244	253	165	30	16	66	150673	933302	933368	campo	normal	TARJETA DE OXXO GAS SIN SALDO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-08 23:51:39.655914	\N	253	f
3415	2026-06-08	17:51:00	13729	67	200	258	\N	29	15	120	642848	2.606095e+06	2.606215e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-09 23:00:54.446965	\N	\N	f
3416	2026-06-09	20:35:00	13730	67	229	280	\N	29	15	120	791540	2.606215e+06	2.606335e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-09 23:03:17.976781	\N	\N	f
3417	2026-06-09	09:42:00	13731	67	224	242	\N	29	15	200	3848	2.606336e+06	2.606536e+06	patio	normal	se mandan 200 litros a ex09 en rio Bravo, recibe Javier Lopez pelucas	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-09 23:04:13.426025	\N	\N	f
3418	2026-06-09	10:09:00	13732	67	241	239	\N	29	15	40	19345	2.606536e+06	2.606576e+06	patio	normal	se lleva Alain 2 Botes	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-09 23:04:51.089085	\N	\N	f
3419	2026-06-09	12:00:00	13734	67	214	257	\N	29	15	70	67520	2.606576e+06	2.606646e+06	patio	normal	se borran codigos, DPF	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-09 23:06:49.01957	\N	\N	f
3420	2026-06-09	13:30:00	13736	67	212	255	\N	29	15	100	48727	2.606746e+06	2.606846e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-09 23:10:38.290818	\N	\N	f
3421	2026-06-09	16:12:00	13737	67	213	256	\N	29	15	100	1.370493e+06	2.606846e+06	2.606946e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-09 23:11:14.899782	\N	\N	f
3422	2026-06-09	16:40:00	13739	67	232	267	\N	29	15	100	480822	2.606946e+06	2.607046e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 00:13:49.892727	\N	\N	f
3423	2026-06-09	16:50:00	13740	67	211	254	\N	29	15	100	36132	2.607047e+06	2.607147e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 00:14:35.700924	\N	\N	f
3424	2026-06-09	16:59:00	13741	67	200	258	\N	29	15	100	643331	2.607147e+06	2.607247e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 00:15:23.496731	\N	\N	f
3425	2026-06-09	17:13:00	13742	67	206	248	\N	29	15	110	519558	2.607347e+06	2.607457e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 00:16:17.051159	\N	\N	f
3426	2026-06-09	17:20:00	13743	67	209	251	\N	29	15	110	44673	2.607457e+06	2.607567e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 00:16:48.785834	\N	\N	f
3427	2026-06-09	17:32:00	13744	67	242	252	\N	29	15	110	46120	2.607568e+06	2.607678e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 00:17:43.350956	\N	\N	f
3428	2026-06-09	17:47:00	13745	67	202	244	\N	29	15	120	70525	2.607678e+06	2.607798e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 00:18:17.248843	\N	\N	f
3429	2026-06-09	17:58:00	13746	67	205	247	\N	29	15	100	20927	2.607798e+06	2.607898e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 00:18:44.884845	\N	\N	f
3430	2026-06-09	18:10:00	13747	67	228	268	\N	29	15	110	6504	2.607899e+06	2.608009e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 01:09:13.343143	\N	\N	f
3431	2026-06-09	18:25:00	13748	67	204	246	\N	29	15	120	444656	2.608009e+06	2.608129e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 01:09:59.462086	\N	\N	f
3432	2026-06-09	19:30:00	13750	67	203	242	\N	29	15	150	129070	2.609108e+06	2.609258e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 01:47:17.649757	\N	\N	f
3433	2026-06-10	07:20:00	11928	67	208	250	146	30	16	100	1.03268e+06	933368	933468	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-10 13:22:52.582317	253	250	f
3434	2026-06-10	07:22:00	11929	67	197	240	146	30	16	120	25103	933468	933588	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-10 13:24:39.018094	253	240	f
3435	2026-06-10	07:24:00	11930	67	252	272	146	30	16	150	2375	933588	933738	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-10 13:26:50.898716	253	272	f
3436	2026-06-10	07:26:00	11931	67	212	273	146	30	16	50	48836	933738	933788	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-10 13:28:50.451473	253	273	f
3437	2026-06-10	11:03:00	11932	67	226	266	157	30	16	120	54896	933788	933908	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-10 17:05:44.340457	253	266	f
3438	2026-06-10	11:05:00	11933	67	228	268	157	30	16	100	6728	933908	934008	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-10 17:07:17.727914	253	268	f
3439	2026-06-10	11:07:00	11934	67	232	267	157	30	16	100	481040	934008	934108	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-10 17:20:44.402948	253	267	f
3440	2026-06-10	11:34:00	11935	67	209	251	157	30	16	50	44885	934108	934158	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-10 17:36:24.609259	253	251	f
3441	2026-06-10	11:36:00	11936	67	198	241	157	30	16	100	81392	934158	934258	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-10 17:38:29.109057	253	241	f
3442	2026-06-09	19:46:00	13751	67	199	280	\N	29	15	130	138998	2.609259e+06	2.609389e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 22:50:34.810525	\N	\N	f
3443	2026-06-10	13:40:00	13752	67	242	252	\N	29	15	120	46120	2.609389e+06	2.609509e+06	patio	normal	KM REALES 2059	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 22:51:52.464293	\N	\N	f
3444	2026-06-10	13:50:00	13753	67	214	257	\N	29	15	110	67789	2.60951e+06	2.60962e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 22:53:27.906132	\N	\N	f
3445	2026-06-10	13:07:00	11937	67	201	243	137	30	16	100	16060	934260	934360	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 22:56:40.344891	\N	243	f
3446	2026-06-10	15:20:00	13755	67	248	258	\N	29	15	40	562926	2.610651e+06	2.610691e+06	patio	normal	PRUEBA HACIA GRUTAS,  ( SIN HUMO )	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 22:58:36.185682	\N	\N	f
3447	2026-06-10	15:31:00	13756	67	211	254	\N	29	15	100	36259	2.610691e+06	2.610791e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 23:03:03.214592	\N	\N	f
3448	2026-06-10	15:44:00	13757	67	199	280	\N	29	15	120	139314	2.610791e+06	2.610911e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 23:15:56.269307	\N	\N	f
3449	2026-06-10	15:55:00	13758	67	213	256	\N	29	15	100	1.370709e+06	2.610912e+06	2.611012e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 23:16:49.185296	\N	\N	f
3450	2026-06-10	16:06:00	13759	67	206	248	\N	29	15	100	519879	2.611012e+06	2.611112e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-10 23:17:45.123583	\N	\N	f
3347	2026-06-06	00:00:00	13684	67	209	251	\N	29	15	80	44129	2.601748e+06	2.601848e+06	patio	normal	Carga postfechada nivel bajo	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 00:08:09.261529	\N	\N	f
3451	2026-06-10	17:45:00	11938	67	216	259	138	30	16	70	5319	934360	934430	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-10 23:49:06.478947	253	259	f
3452	2026-06-10	16:20:00	13760	67	245	279	160	29	15	60	562636	2.611112e+06	2.611172e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 00:12:07.566739	\N	\N	f
3453	2026-06-10	17:02:00	13761	67	200	258	\N	29	15	110	643635	2.611172e+06	2.611282e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 00:14:58.350848	\N	\N	f
3454	2026-06-10	17:08:00	13762	67	202	244	\N	29	15	100	70857	2.611283e+06	2.611383e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 00:15:33.781654	\N	\N	f
3455	2026-06-10	17:16:00	13763	67	209	251	\N	29	15	80	44998	2.611383e+06	2.611463e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 00:16:14.034892	\N	\N	f
3456	2026-06-10	17:41:00	13764	67	205	247	\N	29	15	100	21225	2.611463e+06	2.611563e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 00:16:44.163123	\N	\N	f
3457	2026-06-10	18:30:00	13765	67	212	255	\N	29	15	130	49128	2.611563e+06	2.611693e+06	patio	normal	Aguja en el piso 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 00:46:36.450757	\N	\N	f
3458	2026-06-11	07:14:00	11939	67	197	240	146	30	16	100	25393	934430	934530	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-11 13:16:05.089513	253	240	f
3459	2026-06-11	07:16:00	11940	67	252	272	146	30	16	120	2717	934530	934650	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-11 13:17:17.850048	253	272	f
3460	2026-06-11	07:17:00	11941	67	208	250	146	30	16	100	1.032934e+06	934650	934750	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-11 13:18:41.153324	253	250	f
3461	2026-06-11	09:54:00	11942	67	224	262	156	30	16	100	3873	934750	934850	campo	normal	Ariva de 3/4aprox	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-11 15:57:33.340983	253	262	f
3462	2026-06-11	10:38:00	11943	67	201	243	137	30	16	100	16305	934850	934950	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-11 16:40:39.318187	253	243	f
3463	2026-06-11	11:23:00	11944	67	225	270	142	30	16	305	2715.3	934950	935255	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-11 17:26:08.961319	253	270	f
3464	2026-06-11	13:41:00	11945	67	228	268	146	30	16	100	7036	935255	935355	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-11 19:43:51.062786	253	268	f
3465	2026-06-11	13:43:00	118517	67	226	266	146	30	16	120	55242	935355	935475	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-11 20:08:23.94126	253	266	f
3466	2026-06-11	14:08:00	11947	67	232	267	146	30	16	7	481390	935475	935482	campo	normal	Se termina carga  del diesel nissan	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-11 20:11:10.748369	253	267	f
3472	2026-06-11	15:50:00	13772	67	212	255	\N	29	15	100	49365	2.613144e+06	2.613244e+06	patio	normal	NIVEL MUY BAJO ,  LITROS EXTRA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 22:41:05.503561	\N	\N	f
3521	2026-06-12	19:03:00	13809	67	204	246	\N	29	15	130	445169	2.616064e+06	2.616194e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:29:47.634563	\N	\N	f
3467	2026-06-11	20:25:00	13767	67	241	239	\N	29	15	80	19345	2.611694e+06	2.611734e+06	patio	normal	se lleva 80 litros en botes el arq jose para planta y para retro komatsu	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 22:32:49.866182	\N	\N	f
3468	2026-06-11	\N	\N	67	221	\N	154	31	\N	40	\N	\N	\N	externo	normal	[botes arq jose] vino el arq jose, se llevó 80 litros = 40 planta + 40 R02	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 22:35:26.427543	\N	\N	f
3469	2026-06-11	22:26:00	13768	67	203	242	\N	29	15	120	129564	2.611774e+06	2.611894e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 22:36:51.146959	\N	\N	f
3470	2026-06-11	12:17:00	13769	67	219	239	\N	29	15	19	2769	2.611895e+06	2.611914e+06	patio	normal	movimiento cucharones	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 22:37:29.83609	\N	\N	f
3471	2026-06-11	13:20:00	13770	67	199	280	\N	29	15	80	139489	2.611915e+06	2.611995e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 22:38:07.588532	\N	\N	f
3474	2026-06-12	07:22:00	11948	67	198	241	146	30	16	70	81695	935482	935552	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-12 13:24:40.388096	253	241	f
3475	2026-06-12	07:24:00	11949	67	208	250	146	30	16	100	1.033179e+06	935552	935652	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-12 13:26:55.379215	253	250	f
3476	2026-06-12	07:26:00	15351	67	197	240	146	30	16	100	25664	935652	935752	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-12 13:28:57.71522	253	240	f
3477	2026-06-11	16:26:00	13774	67	202	244	\N	29	15	100	71154	2.613344e+06	2.613444e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-12 13:41:07.140202	\N	\N	f
3478	2026-06-11	16:35:00	13775	67	211	254	\N	29	15	75	36449	2.613444e+06	2.613519e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-12 13:41:52.108269	\N	\N	f
3479	2026-06-11	16:48:00	13776	67	200	258	\N	29	15	70	644048	2.613519e+06	2.613589e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-12 13:42:25.235956	\N	\N	f
3480	2026-06-11	16:57:00	13777	67	232	267	\N	29	15	90	481420	2.61359e+06	2.61368e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-12 13:51:57.884801	\N	\N	f
3481	2026-06-11	17:05:00	13778	67	213	256	\N	29	15	100	1.370911e+06	2.61368e+06	2.61378e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-12 13:52:30.972863	\N	\N	f
3482	2026-06-11	17:20:00	13779	67	205	247	\N	29	15	100	21391	2.61378e+06	2.61388e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-12 13:53:09.231609	\N	\N	f
3483	2026-06-11	17:28:00	13780	67	245	279	\N	29	15	70	562921	2.613881e+06	2.613951e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-12 13:53:50.363762	\N	\N	f
3484	2026-06-11	17:40:00	13781	67	206	248	\N	29	15	99	520191	2.613951e+06	2.61405e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-12 13:57:13.153199	\N	\N	f
3485	2026-06-11	17:51:00	13782	67	204	246	\N	29	15	120	444905	2.614051e+06	2.614171e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-12 13:57:40.178665	\N	\N	f
3486	2026-06-11	18:15:00	13783	67	209	251	\N	29	15	90	45290	2.614172e+06	2.614262e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-12 13:58:27.692732	\N	\N	f
3487	2026-06-12	11:31:00	15352	67	203	242	146	30	16	60	129758	935752	935812	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-12 17:32:41.914606	253	242	f
3488	2026-06-12	11:32:00	15353	67	252	272	146	30	16	60	3185	935812	935872	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-12 17:34:18.462379	253	272	f
3489	2026-06-12	11:34:00	15354	67	201	243	157	30	16	50	16576	935872	935922	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-12 18:53:50.308092	253	243	f
3490	2026-06-12	17:50:00	15355	67	206	248	160	30	16	10	520464	935922	935932	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-12 23:53:00.537665	253	248	f
3491	2026-06-12	09:04:00	131234	67	247	239	\N	29	15	50	7868	2.614262e+06	2.614312e+06	patio	normal	MOVIMIENTOS EN TALLER	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 14:42:06.965786	\N	\N	f
3492	2026-06-12	09:30:00	13785	67	241	239	\N	29	15	40	19345	2.614312e+06	2.614352e+06	patio	normal	MARAVILLAS 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 14:58:58.029067	\N	\N	f
3493	2026-06-12	16:04:00	13787	67	242	252	\N	29	15	1	46120	2.614808e+06	2.614809e+06	patio	normal	KMS REALES 2448	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 15:31:17.014748	\N	\N	f
3494	2026-06-13	16:10:00	13788	68	242	252	\N	29	15	100	46120	2.614809e+06	2.614909e+06	patio	normal	CARGA POSTFECHADA , NIVEL MUY BAJO KMS REALES 2448	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 15:33:23.589426	\N	\N	f
3495	2026-06-12	16:45:00	13789	67	229	257	\N	29	15	100	791774	2.614909e+06	2.615009e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 15:34:32.301091	\N	\N	f
3496	2026-06-12	17:02:00	13790	67	211	254	\N	29	15	1	36608	2.615009e+06	2.61501e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 15:35:26.438149	\N	\N	f
3497	2026-06-13	00:00:00	13791	68	211	254	\N	29	15	100	36608	2.61501e+06	2.61511e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 15:36:31.129672	\N	\N	f
3498	2026-06-12	17:17:00	13792	67	202	244	\N	29	15	1	71475	2.615111e+06	2.615112e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 15:53:54.340155	\N	\N	f
3499	2026-06-13	00:00:00	13793	68	202	244	\N	29	15	100	71475	2.615112e+06	2.615212e+06	patio	normal	CARGA POSTFECHADA NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 15:55:59.591932	\N	\N	f
3500	2026-06-12	17:30:00	13794	67	226	266	\N	29	15	40	55599	2.615212e+06	2.615252e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 15:56:37.79876	\N	\N	f
3501	2026-06-13	00:00:00	13795	68	226	266	\N	29	15	100	55599	2.615253e+06	2.615353e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:01:44.308654	\N	\N	f
3502	2026-06-12	17:36:00	13796	67	228	268	\N	29	15	50	7290	2.615353e+06	2.615403e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:03:09.3895	\N	\N	f
3503	2026-06-13	00:00:00	13797	68	228	268	\N	29	15	100	7290	2.615403e+06	2.615503e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:06:24.298636	\N	\N	f
3504	2026-06-12	17:54:00	13798	67	200	258	\N	29	15	50	644593	2.615504e+06	2.615554e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:07:09.161033	\N	\N	f
3505	2026-06-12	18:03:00	13799	67	232	267	\N	29	15	5	481745	2.615554e+06	2.615559e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:11:23.662091	\N	\N	f
3506	2026-06-13	10:09:00	15356	68	198	241	146	30	16	100	81914	935932	936032	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-13 16:11:53.362931	253	241	f
3507	2026-06-13	10:11:00	15357	68	208	250	146	30	16	100	1.033434e+06	936032	936132	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-13 16:13:32.954868	253	250	f
3508	2026-06-13	00:00:00	13800	68	232	267	\N	29	15	100	481745	2.615559e+06	2.615659e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:14:21.40008	\N	\N	f
3509	2026-06-13	10:13:00	15358	68	197	240	146	30	16	120	25889	936132	936252	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-13 16:15:03.708524	253	240	f
3510	2026-06-13	10:15:00	15359	68	201	243	146	30	16	100	16669	936252	936352	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-13 16:16:33.434492	253	243	f
3511	2026-06-13	10:16:00	15360	68	216	259	138	30	16	70	5331	936352	936422	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-13 16:17:55.643641	253	259	f
3512	2026-06-13	10:17:00	15361	68	217	259	138	30	16	24	1042.1	936422	936446	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-13 16:20:07.584065	253	259	f
3513	2026-06-12	18:27:00	13801	67	212	255	\N	29	15	1	49589	2.61566e+06	2.615661e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:21:01.988406	\N	\N	f
3514	2026-06-13	00:00:00	13802	68	212	255	\N	29	15	100	49589	2.615661e+06	2.615761e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:21:38.379314	\N	\N	f
3515	2026-06-12	18:32:00	13804	67	245	279	\N	29	15	30	563243	2.615762e+06	2.615792e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:23:01.541691	\N	\N	f
3516	2026-06-12	18:40:00	13805	67	205	247	\N	29	15	20	21598	2.615812e+06	2.615832e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:23:48.517839	\N	\N	f
3517	2026-06-13	00:00:00	13806	68	205	247	\N	29	15	100	21598	2.615832e+06	2.615932e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:25:29.006898	\N	\N	f
3518	2026-06-12	18:52:00	13807	67	209	251	\N	29	15	1	45464	2.615933e+06	2.615934e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:26:39.961711	\N	\N	f
3519	2026-06-13	00:00:00	13808	68	209	251	\N	29	15	130	45464	2.615934e+06	2.616064e+06	patio	normal	CARGA POSTFECHADA, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:27:40.649127	\N	\N	f
3520	2026-06-12	18:25:00	13803	67	206	248	\N	29	15	20	520465	2.615762e+06	2.615782e+06	patio	normal	SE CARGA AFUERA DE TALLER, LLEGO SIN DIESEL A GUERRERO Y SE APAGO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:29:15.522209	\N	\N	f
3522	2026-06-13	00:00:00	13810	68	206	248	\N	29	15	150	520466	2.616194e+06	2.616344e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:30:49.045776	\N	\N	f
3523	2026-06-09	11:10:00	13733	67	250	239	\N	29	15	100	1	2.606576e+06	2.606676e+06	patio	normal	SE CARGA HILUX, REPARTE 50 A CA27 Y 50 A CA21	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:32:16.840252	\N	\N	t
3524	2026-06-09	\N	\N	67	201	\N	145	31	\N	50	15689	\N	\N	externo	normal	[Externo] 50 LITROS DE HILUX, FOLIO 13733	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:35:03.138537	\N	\N	f
3527	2026-06-12	\N	\N	67	252	\N	162	31	\N	1	3323	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:42:55.401585	\N	\N	f
3528	2026-06-12	\N	\N	67	197	\N	162	31	\N	1	25871	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:43:31.565984	\N	\N	f
3525	2026-06-09	\N	\N	67	204	\N	145	31	\N	50	444531	\N	\N	externo	normal	[Externo] SURTE HILUX 50 FOLIO: 13733	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:35:36.528947	\N	\N	f
3526	2026-06-12	\N	\N	67	203	\N	162	31	\N	1	129896	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:42:20.914535	\N	\N	f
3529	2026-06-12	\N	\N	67	198	\N	162	31	\N	1	81893	\N	\N	externo	normal	[CORTE KMS]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 16:44:24.479304	\N	\N	f
3473	2026-06-11	16:06:00	13773	67	242	252	\N	29	15	99	46120	2.613244e+06	2.613343e+06	patio	normal	KM REALES, 2261 NIVEL MUY BAJO , LITROS EXTRA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-11 22:43:55.258111	\N	\N	f
3530	2026-06-13	11:35:00	15362	68	199	280	137	30	16	110	139825	936446	936556	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-13 17:36:42.589913	253	280	f
3531	2026-06-13	09:36:00	13811	68	241	239	\N	29	15	40	19345	2.616345e+06	2.616385e+06	patio	normal	Llega el Arq Jose para llevar diésel a maravillas 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:01:56.630802	\N	\N	f
3532	2026-06-13	09:40:00	13812	68	221	264	\N	29	15	40	6902	2.616385e+06	2.616425e+06	patio	normal	Arq Jose lleva 2 yogas 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:02:46.551608	\N	\N	f
3533	2026-06-13	12:15:00	13813	68	252	272	\N	29	15	150	3418	2.616425e+06	2.616575e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:04:31.062925	\N	\N	f
3534	2026-06-13	00:20:00	13814	68	203	242	\N	29	15	150	129987	2.616575e+06	2.616725e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:05:16.535771	\N	\N	f
3535	2026-06-13	00:35:00	13815	68	197	240	\N	29	15	30	25985	2.616725e+06	2.616755e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:06:13.780916	\N	\N	f
3536	2026-06-13	12:55:00	13816	68	200	244	\N	29	15	100	644798	2.616755e+06	2.616855e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:06:58.500395	\N	\N	f
3537	2026-06-13	13:01:00	13817	68	213	256	\N	29	15	100	1.371144e+06	2.616855e+06	2.616955e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:08:33.059626	\N	\N	f
3538	2026-06-13	13:08:00	13818	68	211	254	\N	29	15	50	36688	2.616956e+06	2.617006e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:09:50.001637	\N	\N	f
3539	2026-06-13	13:20:00	13819	68	229	269	\N	29	15	70	791862	2.617006e+06	2.617076e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:11:51.149691	\N	\N	f
3541	2026-06-13	13:40:00	13821	68	212	255	\N	29	15	50	49687	2.617197e+06	2.617247e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:13:33.29558	\N	\N	f
3542	2026-06-13	13:47:00	13822	68	242	252	\N	29	15	50	46120	2.617247e+06	2.617297e+06	patio	normal	Kilómetros reales 2555	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:14:20.391516	\N	\N	f
3543	2026-06-13	16:10:00	13823	68	209	251	\N	29	15	50	45624	2.617297e+06	2.617347e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 21:05:55.732162	\N	\N	f
3544	2026-06-13	14:35:00	13824	68	204	246	\N	29	15	100	445336	2.617348e+06	2.617448e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 21:06:49.996885	\N	\N	f
3545	2026-06-13	14:51:00	13825	68	245	279	\N	29	15	100	563419	2.617448e+06	2.617548e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 21:07:24.988819	\N	\N	f
3546	2026-06-13	17:01:00	15363	68	244	253	171	30	16	39	150673	936556	936595	campo	normal	157506 A 157934  km pasado de 400 km	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-13 23:07:34.455172	253	253	t
3547	2026-06-15	08:19:00	15364	68	234	271	168	30	16	259	3759.1	936595	936854	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-15 14:23:11.597384	253	271	f
3548	2026-06-15	12:33:00	15365	68	218	262	156	30	16	41	1453.3	936854	936895	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-15 18:36:06.090461	253	262	f
3549	2026-06-15	12:36:00	15366	68	224	262	156	30	16	100	3894	936895	936995	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-15 18:38:41.373772	253	262	f
3550	2026-06-15	12:38:00	15367	68	226	266	145	30	16	120	55902	936995	937115	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-15 18:40:38.426401	253	266	f
3552	2026-06-15	17:09:00	15369	68	197	240	145	30	16	120	26137	937215	937335	campo	normal	Hora de carga 12:24pm	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-15 23:12:26.332089	253	240	f
3551	2026-06-15	17:05:00	15368	68	201	243	145	30	16	100	16689	937115	937215	campo	normal	Km16912 12:15 pm	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-15 23:09:38.739796	253	243	t
3554	2026-06-15	08:09:00	13828	68	250	239	\N	29	15	60	1	2.618503e+06	2.618563e+06	patio	normal	CARGA PARA CAMION QUE SE RECOGE CON REY CANALES - DALTO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:05:35.824103	\N	\N	f
3555	2026-06-15	10:31:00	13829	68	242	252	\N	29	15	100	46120	2.618563e+06	2.618663e+06	patio	normal	KMS REALES 2662	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:06:04.988107	\N	\N	f
3556	2026-06-15	15:12:00	13851	68	199	280	\N	29	15	110	140184	2.618665e+06	2.618775e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:08:44.780099	\N	\N	f
3557	2026-06-15	15:26:00	13852	68	211	254	\N	29	15	110	36847	2.618775e+06	2.618885e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:10:56.098091	\N	\N	f
3558	2026-06-15	16:08:00	13853	68	229	269	\N	29	15	100	792110	2.618885e+06	2.618985e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:11:28.478964	\N	\N	f
3559	2026-06-15	16:19:00	13854	68	209	251	\N	29	15	110	45835	2.618985e+06	2.619095e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:12:17.637889	\N	\N	f
3560	2026-06-15	16:25:00	13855	68	248	244	\N	29	15	100	562966	2.619095e+06	2.619195e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:12:51.196701	\N	\N	f
3561	2026-06-15	16:35:00	13856	68	206	248	\N	29	15	100	520822	2.619197e+06	2.619297e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:19:47.354218	\N	\N	f
3562	2026-06-15	16:41:00	13857	68	205	248	\N	29	15	100	21863	2.619297e+06	2.619397e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:20:11.245182	\N	\N	f
3563	2026-06-15	17:00:00	13858	68	212	255	\N	29	15	100	49982	2.619397e+06	2.619497e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:21:35.468941	\N	\N	f
3564	2026-06-15	17:12:00	13859	68	228	268	\N	29	15	100	7688	2.619497e+06	2.619597e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:22:01.247486	\N	\N	f
3565	2026-06-16	07:49:00	15370	68	198	241	146	30	16	100	82209	937335	937435	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-16 13:51:01.59338	253	241	f
3566	2026-06-15	18:25:00	13860	68	213	256	\N	29	15	100	1.371359e+06	2.619597e+06	2.619697e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:29:43.809114	\N	\N	f
3567	2026-06-16	08:40:00	13861	68	208	250	\N	29	15	85	1.033727e+06	2.619698e+06	2.619783e+06	patio	normal	Prueba de rendimiento 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:31:02.255594	\N	\N	f
3568	2026-06-16	15:54:00	13863	68	232	267	\N	29	15	100	482166	2.620693e+06	2.620793e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:34:20.650111	\N	\N	f
3569	2026-06-16	16:01:00	13864	68	201	243	\N	29	15	120	17141	2.620793e+06	2.620913e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:35:02.089436	\N	\N	f
3570	2026-06-16	16:14:00	131238	68	213	256	\N	29	15	100	1.371538e+06	2.620913e+06	2.621013e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:35:45.500553	\N	\N	f
3571	2026-06-16	16:25:00	13866	68	211	254	\N	29	15	100	37072	2.621013e+06	2.621113e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:36:11.415631	\N	\N	f
3572	2026-06-16	16:35:00	13867	68	245	279	\N	29	15	100	563778	2.621113e+06	2.621213e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:42:02.080002	\N	\N	f
3573	2026-06-16	16:45:00	13868	68	242	252	\N	29	15	100	46120	2.621213e+06	2.621313e+06	patio	normal	KMS REALES 2911	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:42:53.859245	\N	\N	f
3574	2026-06-16	16:52:00	13869	68	205	247	\N	29	15	50	22044	2.621313e+06	2.621363e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:43:34.339798	\N	\N	f
3575	2026-06-16	16:54:00	13870	68	209	251	\N	29	15	110	46076	2.621364e+06	2.621474e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:44:04.904485	\N	\N	f
3576	2026-06-16	17:07:00	13871	68	212	255	\N	29	15	100	50167	2.621474e+06	2.621574e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-17 00:44:28.126407	\N	\N	f
3577	2026-06-17	06:35:00	15374	68	229	269	146	30	16	100	792396	937435	937535	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-17 12:56:50.727467	253	269	f
3578	2026-06-17	06:56:00	15375	68	206	248	146	30	16	100	521131	937535	937635	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-17 12:58:18.605893	253	248	f
3579	2026-06-17	06:58:00	15376	68	197	240	146	30	16	120	26404	937635	937755	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-17 12:59:54.018083	253	240	f
3580	2026-06-17	06:59:00	15377	68	204	246	146	30	16	120	445798	937755	937875	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-17 13:01:13.244142	253	246	f
3581	2026-06-17	13:50:00	15378	68	225	270	142	30	16	271	2743.5	937875	938146	campo	normal	Hora de carga 9:32am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-17 19:53:15.002616	253	270	f
3582	2026-06-17	13:53:00	15379	68	216	259	138	30	16	88	5343	938146	938234	campo	normal	Hora de carga 12:56 pm	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-17 19:55:45.274335	253	259	f
3583	2026-06-17	10:00:00	13872	68	207	239	\N	29	15	100	485761	2.621574e+06	2.621674e+06	patio	normal	LO TOMA VICTORIANO PARA PRUEBA  (INY.)	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:17:37.514844	\N	\N	f
3584	2026-06-17	16:16:00	13873	68	213	256	\N	29	15	100	1.371707e+06	2.621674e+06	2.621774e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:18:58.993446	\N	\N	f
3585	2026-06-17	16:25:00	13874	68	226	266	\N	29	15	150	56234	2.621774e+06	2.621924e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:19:43.925099	\N	\N	f
3586	2026-06-17	16:32:00	13875	68	228	268	\N	29	15	100	8070	2.621924e+06	2.622024e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:20:50.674705	\N	\N	f
3587	2026-06-17	16:08:00	13876	68	242	252	\N	29	15	100	46120	2.622024e+06	2.622124e+06	patio	normal	KMS REALES: 3129	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:22:19.07567	\N	\N	f
3588	2026-06-17	16:50:00	13877	68	209	251	\N	29	15	100	46326	2.622125e+06	2.622225e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:22:58.948463	\N	\N	f
3589	2026-06-17	17:00:00	13878	68	229	269	\N	29	15	80	792551	2.622225e+06	2.622305e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:23:32.916366	\N	\N	f
3590	2026-06-17	17:14:00	13879	68	212	255	\N	29	15	100	50413	2.622305e+06	2.622405e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:26:07.712846	\N	\N	f
3591	2026-06-17	17:25:00	13880	68	205	247	\N	29	15	100	22239	2.622405e+06	2.622505e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:29:03.112631	\N	\N	f
3592	2026-06-17	17:31:00	13881	68	204	246	\N	29	15	100	446062	2.622505e+06	2.622605e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:29:38.097497	\N	\N	f
3593	2026-06-17	17:40:00	13882	68	211	254	\N	29	15	100	37277	2.622605e+06	2.622705e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:30:06.252042	\N	\N	f
3594	2026-06-17	17:40:00	13883	68	214	257	\N	29	15	100	68312	2.622705e+06	2.622805e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:34:40.49812	\N	\N	f
3595	2026-06-17	18:02:00	13884	68	206	248	\N	29	15	100	521348	2.622805e+06	2.622905e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:36:43.261503	\N	\N	f
3596	2026-06-17	18:11:00	13885	68	232	267	\N	29	15	100	482415	2.622905e+06	2.623005e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:37:39.211974	\N	\N	f
3597	2026-06-17	18:20:00	13886	68	199	280	\N	29	15	110	140749	2.623005e+06	2.623115e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-18 00:39:41.80205	\N	\N	f
3598	2026-06-18	06:46:00	15380	68	198	241	146	30	16	100	82451	938234	938334	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-18 12:48:23.425125	253	241	f
3599	2026-06-18	06:48:00	15381	68	252	272	146	30	16	150	3882	938334	938484	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-18 12:50:10.80635	253	272	f
3600	2026-06-18	18:20:00	15382	68	197	240	172	30	16	52	26760	938484	938536	campo	normal	Hora de carga 12;41 pm	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 00:24:48.221887	253	240	f
3601	2026-06-18	07:52:00	13887	68	208	250	\N	29	15	114	1.033971e+06	2.623115e+06	2.623229e+06	patio	normal	PRUEBA DE RENDIMIENTO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 03:02:58.6331	\N	\N	f
3602	2026-06-18	10:54:00	13888	68	237	258	\N	29	15	80	372625	2.623229e+06	2.623309e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 03:03:56.317283	\N	\N	f
3603	2026-06-18	03:34:00	13890	68	204	246	\N	29	15	100	446267	2.623309e+06	2.623409e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 03:04:55.129953	\N	\N	f
3604	2026-06-18	15:17:00	13889	68	209	251	\N	29	15	80	46539	2.623409e+06	2.623489e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 03:05:28.199039	\N	\N	f
3605	2026-06-18	\N	\N	68	208	\N	\N	31	\N	93	1.034185e+06	\N	\N	externo	normal	[OXXO GAS] PRUEBA DE RENDIMIENTO, CARGA FINAL	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 03:06:50.572884	\N	\N	f
3553	2026-06-15	07:35:00	13827	68	208	250	\N	29	15	309	1.03357e+06	2.618194e+06	2.618503e+06	patio	normal	PRUEBA DE RENDIMIENTO DIA 1	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-16 00:04:47.091525	\N	\N	f
3606	2026-06-19	06:00:00	13891	68	250	239	160	29	15	62	1	2.62349e+06	2.623552e+06	patio	normal	Se vacía contenido de tanque en taller, \nTanque totalmente vacío \nRemanente teórico 347lt	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 14:30:58.241523	\N	\N	f
3607	2026-06-19	08:20:00	13892	68	242	252	\N	29	15	90	46120	2.623552e+06	2.623642e+06	patio	normal	Kms 3384	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 15:06:41.041709	\N	\N	f
3608	2026-06-19	08:53:00	13893	68	206	248	\N	29	15	120	521671	2.623642e+06	2.623762e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 15:08:27.042228	\N	\N	f
3610	2026-06-19	09:00:00	13894	68	228	268	\N	29	15	120	8369	2.623763e+06	2.623883e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 18:21:46.380795	\N	\N	f
3611	2026-06-19	09:20:00	13895	68	202	244	\N	29	15	100	71629	2.623883e+06	2.623983e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 18:22:15.304825	\N	\N	f
3612	2026-06-19	09:24:00	13897	68	211	254	\N	29	15	90	37515	2.623983e+06	2.624073e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 18:23:02.414211	\N	\N	f
3613	2026-06-19	09:39:00	13898	68	229	269	\N	29	15	140	792868	2.624074e+06	2.624214e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 18:23:56.470425	\N	\N	f
3615	2026-06-19	12:43:00	15383	68	198	241	146	30	16	70	82620	938536	938606	campo	normal	Hora de carga 11;40 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 18:45:35.325437	253	241	f
3616	2026-06-19	12:45:00	15384	68	213	256	146	30	16	100	1.371936e+06	938606	938706	campo	normal	Hora de carga 11:47 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 18:47:42.663211	253	256	f
3617	2026-06-19	12:47:00	15385	68	203	242	146	30	16	110	130742	938706	938816	campo	normal	Hora de carga 11;55 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 18:50:13.051393	253	242	f
3618	2026-06-19	12:50:00	15386	68	197	240	146	30	16	100	26960	938816	938916	campo	normal	Hora de carga 12;01 pm	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 18:53:12.396642	253	240	f
3619	2026-06-19	14:23:00	15387	68	252	272	157	30	16	80	4376	938916	938996	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 20:26:07.657706	253	272	f
3620	2026-06-19	14:26:00	15388	68	209	251	157	30	16	19	46710	938996	939015	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 20:28:29.349488	253	251	f
3621	2026-06-19	14:28:00	15389	68	226	266	157	30	16	120	56728	939015	939135	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 20:41:52.186337	253	266	f
3622	2026-06-19	15:28:00	15390	68	199	280	157	30	16	100	141000	939135	939235	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 21:30:05.708184	253	280	f
3623	2026-06-19	15:30:00	15391	68	232	267	157	30	16	100	482854	939235	939335	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 21:31:49.723977	253	267	f
3624	2026-06-19	15:31:00	15392	68	214	257	157	30	16	100	68683	939335	939435	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-19 21:33:28.75376	253	257	f
3625	2026-06-19	11:40:00	13901	68	205	247	\N	29	15	100	22525	2.625433e+06	2.625533e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 00:24:36.642776	\N	\N	f
3629	2026-06-20	00:00:00	13905	69	211	254	\N	29	15	50	37629	2.625713e+06	2.625763e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 00:27:27.987569	\N	\N	f
3630	2026-06-19	20:56:00	15393	68	204	246	163	30	16	100	446559	939435	939535	campo	normal	Carga autorizada  por beto	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-20 02:59:46.047369	253	246	f
3631	2026-06-19	18:28:00	13906	68	229	269	\N	29	15	60	793062	2.625764e+06	2.625824e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:19:23.996513	\N	\N	f
3651	2026-06-16	\N	\N	70	214	\N	\N	31	\N	120	68100	\N	\N	externo	normal	[OXXOGAS] MAGO CARGA EN OXXOGAS	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 17:55:20.201602	\N	\N	f
3652	2026-06-20	08:43:00	13907	69	206	248	\N	29	15	100	521848	2.625825e+06	2.625925e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 18:42:16.120809	\N	\N	f
3540	2026-06-13	13:30:00	13820	68	215	258	\N	29	15	1	47356	2.617076e+06	2.617196e+06	patio	normal	Sale de taller Kenworth \nSE REAJUSTAN LITROS POR QUE LE SACAMOS 200 AL TANQUE PARA METER DE OXXO GAS EL DIA 15 DE JUNIO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 20:12:42.394681	\N	\N	f
3626	2026-06-19	14:30:00	13902	68	215	258	\N	29	15	120	47697	2.625533e+06	2.625653e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 00:25:19.13905	\N	\N	f
3633	2026-06-19	\N	\N	68	203	\N	162	31	\N	1	130801	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:35:16.323198	\N	\N	f
3634	2026-06-19	\N	\N	68	214	\N	162	31	\N	1	68710	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:35:48.488316	\N	\N	f
3635	2026-06-19	\N	\N	68	252	\N	162	31	\N	1	4383	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:36:39.160552	\N	\N	f
3636	2026-06-19	\N	\N	68	226	\N	162	31	\N	1	56761	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:37:10.520373	\N	\N	f
3637	2026-06-19	\N	\N	68	213	\N	162	31	\N	1	1.372003e+06	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:38:26.94167	\N	\N	f
3638	2026-06-19	\N	\N	68	232	\N	162	31	\N	1	482882	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:39:06.446457	\N	\N	f
3639	2026-06-19	\N	\N	68	228	\N	162	31	\N	1	8516	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:39:34.17076	\N	\N	f
3640	2026-06-19	\N	\N	68	209	\N	162	31	\N	1	46736	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:41:17.085599	\N	\N	f
3641	2026-06-19	\N	\N	68	206	\N	162	31	\N	1	521842	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:41:44.615375	\N	\N	f
3642	2026-06-19	\N	\N	68	197	\N	162	31	\N	1	27059	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:42:12.743135	\N	\N	f
3643	2026-06-19	\N	\N	68	205	\N	162	31	\N	1	22635	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:42:33.475354	\N	\N	f
3644	2026-06-19	\N	\N	68	198	\N	162	31	\N	1	82709	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:42:57.868138	\N	\N	f
3645	2026-06-19	\N	\N	68	211	\N	162	31	\N	1	37629	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:43:38.480539	\N	\N	f
3628	2026-06-19	18:26:00	13904	68	237	279	\N	29	15	50	372925	2.625663e+06	2.625713e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 00:26:43.87332	\N	\N	t
3653	2026-06-20	09:35:00	13909	69	202	244	\N	29	15	100	71794	2.625925e+06	2.626025e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 18:43:22.43524	\N	\N	f
3648	2026-06-18	\N	\N	68	241	\N	154	31	\N	40	\N	\N	\N	externo	normal	[Externo] SE MANDAN 40 LITROS DE STOCK EN TALLER (CA06) CON ARQ JOSE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:58:17.166962	\N	\N	f
3649	2026-06-18	\N	\N	68	221	\N	154	31	\N	40	\N	\N	\N	externo	normal	[Externo] SE MANDAN 40 LITROS DE STOCK EN TALLER (CA06) CON ARQ JOSE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:58:34.267083	\N	\N	f
3647	2026-06-19	\N	\N	68	221	\N	154	31	\N	40	\N	\N	\N	externo	normal	[Externo] SE MANDAN 40 LITROS DE STOCK EN TALLER (CA06) CON ARQ JOSE, FUERON 2 DIAS SEGUIDOS QUE VINO JOSE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:45:28.484213	\N	\N	f
3646	2026-06-19	\N	\N	68	241	\N	154	31	\N	40	\N	\N	\N	externo	normal	[STOCK TALLER] SE MANDAN 40 LITROS DE STOCK EN TALLER (CA06) CON ARQ JOSE,FUERON 2 DIAS SEGUIDOS QUE VINO JOSE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:45:06.366584	\N	\N	f
3632	2026-06-15	\N	442650000	68	215	\N	\N	31	\N	185	\N	\N	\N	externo	normal	[OXXOGAS] SE RELLENAN 185 LITROS DE OXXOGAS, PREVIAMENTE HABIAMOS RETIRADO 200 LITROS DE ESTE CAMION  ( QUEDARON DE STOCK )	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 16:29:52.934311	\N	\N	f
3650	2026-06-16	\N	\N	70	203	\N	\N	31	\N	120	\N	\N	\N	externo	normal	[OXXO GAS] MAGO CARGA EN OXXO GAS , TICKET 384658330	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 17:54:12.346364	\N	\N	f
3655	2026-06-20	10:17:00	13911	69	226	266	\N	29	15	50	56766	2.626125e+06	2.626175e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 18:44:48.624057	\N	\N	f
3656	2026-06-20	10:21:00	13912	69	215	258	\N	29	15	100	47725	2.626176e+06	2.626276e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 18:47:45.979803	\N	\N	f
3658	2026-06-20	10:57:00	13914	69	211	254	\N	29	15	60	37643	2.626377e+06	2.626437e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 18:48:53.532254	\N	\N	f
3659	2026-06-20	11:15:00	13915	69	209	251	\N	29	15	100	46749	2.626437e+06	2.626537e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 18:49:24.927277	\N	\N	f
3660	2026-06-20	11:22:00	13916	69	203	242	\N	29	15	120	130862	2.626537e+06	2.626657e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 18:50:12.341121	\N	\N	f
3661	2026-06-20	11:35:00	13917	69	237	279	\N	29	15	64	372931	2.626657e+06	2.626721e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 19:03:10.479628	\N	\N	f
3662	2026-06-20	11:51:00	13918	69	213	256	\N	29	15	60	1.372087e+06	2.626721e+06	2.626781e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 19:04:19.358465	\N	\N	f
3663	2026-06-20	12:00:00	13919	69	228	268	\N	29	15	100	8522	2.626782e+06	2.626882e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 19:05:45.578792	\N	\N	f
3664	2026-06-20	12:15:00	13920	69	214	257	\N	29	15	100	68847	2.626882e+06	2.626982e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 19:06:40.456045	\N	\N	f
3665	2026-06-20	12:22:00	13921	69	204	246	\N	29	15	100	446718	2.626983e+06	2.627083e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 19:07:59.442963	\N	\N	f
3666	2026-06-22	08:36:00	159140	69	244	253	163	30	16	66	150673	939535	939601	campo	normal	159140 tanwue lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-22 14:38:35.520972	253	253	t
3667	2026-06-22	08:38:00	15395	69	234	271	168	30	16	294	3791.3	939601	939895	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-22 14:41:32.142735	253	271	f
3668	2026-06-22	05:20:00	13926	69	198	241	\N	29	15	100	82847	2.628356e+06	2.628456e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-22 15:17:59.107079	\N	\N	f
3669	2026-06-22	10:51:00	15396	69	225	270	142	30	16	295	2771.5	939895	940190	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-22 16:54:15.190067	253	270	f
3627	2026-06-19	16:00:00	13903	68	242	252	\N	29	15	10	3537	2.625653e+06	2.625663e+06	patio	normal	Kms 3537	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 00:26:14.847086	\N	\N	f
3657	2026-06-20	10:47:00	13913	69	212	255	\N	29	15	100	0	2.626276e+06	2.626376e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 18:48:23.906367	\N	\N	f
3670	2026-06-20	12:30:00	13923	69	199	280	\N	29	15	120	141105	2.627083e+06	2.627203e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-22 18:30:51.385689	\N	\N	f
3671	2026-06-20	13:02:00	13924	69	229	269	\N	29	15	100	793215	2.627203e+06	2.627303e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-22 18:31:20.207712	\N	\N	f
3672	2026-06-22	14:22:00	15397	69	201	243	173	30	16	100	17389	940190	940290	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-22 20:24:05.443029	253	243	f
3673	2026-06-22	09:40:00	13927	69	241	239	\N	29	15	62	19345	2.628459e+06	2.628521e+06	patio	normal	PASA ARQ JOSÉ POR 3 BOTES PARA LA PLANTA VERDE 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:31:58.615498	\N	\N	f
3674	2026-06-22	09:40:00	13928	69	217	239	\N	29	15	20	1042.1	2.628521e+06	2.628541e+06	patio	normal	PASA ARQ JOSE POR 1 BOTE PARA RODILLO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:32:33.005461	\N	\N	f
3675	2026-06-22	16:11:00	13929	69	232	267	\N	29	15	100	483131	2.628581e+06	2.628681e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:33:28.388758	\N	\N	f
3676	2026-06-22	16:20:00	13930	69	229	269	\N	29	15	100	793328	2.628641e+06	2.628741e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:34:20.454737	\N	\N	f
3677	2026-06-22	16:29:00	13931	69	226	266	\N	29	15	120	56932	2.628742e+06	2.628862e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:34:56.429826	\N	\N	f
3678	2026-06-22	16:41:00	13932	69	215	258	\N	29	15	100	47910	2.628862e+06	2.628962e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:35:46.909655	\N	\N	f
3679	2026-06-22	16:58:00	13933	69	202	244	\N	29	15	75	71960	2.628963e+06	2.629038e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:36:20.399189	\N	\N	f
3680	2026-06-22	17:10:00	13934	69	199	280	\N	29	15	100	141385	2.629038e+06	2.629138e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:37:54.560831	\N	\N	f
3681	2026-06-22	17:20:00	13935	69	228	268	\N	29	15	100	8771	2.629138e+06	2.629238e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:38:26.504691	\N	\N	f
3682	2026-06-22	17:30:00	13936	69	206	248	\N	29	15	100	522087	2.629238e+06	2.629338e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:40:16.191432	\N	\N	f
3683	2026-06-22	17:45:00	13937	69	211	254	\N	29	15	100	37818	2.629338e+06	2.629438e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:40:39.736822	\N	\N	f
3684	2026-06-22	18:15:00	13938	69	209	251	\N	29	15	120	46965	2.629439e+06	2.629559e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 01:41:06.961318	\N	\N	f
3685	2026-06-23	05:20:00	13939	69	198	241	\N	29	15	50	83026	2.629559e+06	2.629609e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-23 11:40:08.211926	\N	\N	f
3686	2026-06-23	05:44:00	15398	69	252	272	163	30	16	120	4613	940290	940410	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-23 12:22:29.838036	253	272	f
3687	2026-06-23	09:37:00	15399	69	216	259	138	30	16	66	5354	940410	940476	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-23 15:39:53.080918	253	259	f
3688	2026-06-23	07:00:00	13940	69	205	247	\N	29	15	100	22795	2.629609e+06	2.629709e+06	patio	normal	MANTENIMIENTO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:29:11.249479	\N	\N	f
3689	2026-06-23	07:50:00	13941	69	197	240	\N	29	15	120	27254	2.62971e+06	2.62983e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:29:58.640908	\N	\N	f
3690	2026-06-23	12:15:00	13942	69	213	256	\N	29	15	100	1.372229e+06	2.62983e+06	2.62993e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:30:29.238495	\N	\N	f
3691	2026-06-23	16:05:00	13944	69	201	243	\N	29	15	100	17572	2.630882e+06	2.630982e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:33:21.000481	\N	\N	f
3692	2026-06-23	16:15:00	13945	69	226	266	\N	29	15	100	57156	2.630982e+06	2.631082e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:33:47.033546	\N	\N	f
3693	2026-06-23	16:25:00	13946	69	232	267	\N	29	15	100	483371	2.631082e+06	2.631182e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:34:14.761283	\N	\N	f
3696	2026-06-23	16:47:00	13948	69	206	248	\N	29	15	100	522387	2.631282e+06	2.631382e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:38:27.829498	\N	\N	f
3697	2026-06-23	17:23:00	13949	69	199	280	\N	29	15	110	141700	2.631382e+06	2.631492e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:39:05.992511	\N	\N	f
3698	2026-06-23	17:34:00	13950	69	204	246	\N	29	15	120	447063	2.631493e+06	2.631613e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:39:34.978742	\N	\N	f
3699	2026-06-23	17:47:00	14152	69	209	280	\N	29	15	100	47159	2.631613e+06	2.631713e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:40:52.721856	\N	\N	f
3700	2026-06-23	\N	\N	69	242	\N	160	31	\N	1	3686	\N	\N	externo	normal	[TALLER] PRUEBA RESETEO HUBODOMETRO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:44:20.235572	\N	\N	f
3654	2026-06-20	09:57:00	13910	69	242	252	\N	29	15	100	3544	2.626025e+06	2.626125e+06	patio	normal	KMS 3544	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 18:44:19.830115	\N	\N	f
3614	2026-06-19	09:55:00	13899	68	212	255	\N	29	15	100	0	2.624214e+06	2.624314e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-19 18:29:08.544483	\N	\N	f
3695	2026-06-23	16:35:00	13947	69	212	255	\N	29	15	100	246	2.631182e+06	2.631282e+06	patio	normal	RESET HUBODOMETRO 239 KM	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:37:02.631656	\N	\N	f
3701	2026-06-23	17:56:00	14153	69	242	252	\N	29	15	60	3687	2.631713e+06	2.631773e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:51:11.12093	\N	\N	f
3702	2026-06-23	18:02:00	14154	69	229	269	\N	29	15	100	793670	2.631773e+06	2.631873e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 00:51:40.210089	\N	\N	f
3703	2026-06-24	06:38:00	14101	69	214	257	146	30	16	110	69135	940476	940586	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-24 12:40:43.190762	253	257	f
3704	2026-06-24	06:40:00	14102	69	252	272	146	30	16	120	4789	940586	940706	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-24 12:42:45.330711	253	272	f
3705	2026-06-24	05:03:00	14155	69	198	241	\N	29	15	70	83201	2.631874e+06	2.631944e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 13:04:58.436652	\N	\N	f
3706	2026-06-24	07:04:00	14156	69	205	247	\N	29	15	100	22948	2.631944e+06	2.632044e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-24 13:06:37.681528	\N	\N	f
3707	2026-06-24	11:27:00	14103	69	211	254	146	30	16	100	38025	940706	940806	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-24 17:29:48.269111	253	254	f
3709	2026-06-24	17:45:00	14105	69	216	259	138	30	16	87	5367	940881	940968	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-24 23:47:22.330717	253	259	f
3710	2026-06-24	17:47:00	14106	69	209	251	136	30	16	100	47352	940968	941068	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-24 23:49:00.353192	253	251	f
3711	2026-06-24	17:49:00	14107	69	215	258	\N	30	16	110	48246	941068	941178	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-24 23:50:18.96092	253	258	f
3712	2026-06-24	17:50:00	14108	69	212	255	136	30	16	100	409	941178	941278	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-24 23:53:18.062884	253	255	f
3713	2026-06-24	19:50:00	14157	69	197	240	\N	29	15	100	27380	2.632044e+06	2.632144e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-25 00:17:41.045904	\N	\N	f
3714	2026-06-24	15:16:00	14158	69	199	280	\N	29	15	120	141900	2.632145e+06	2.632265e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-25 00:18:14.012167	\N	\N	f
3715	2026-06-24	15:28:00	14159	69	202	244	\N	29	15	100	72357	2.632265e+06	2.632365e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-25 00:18:44.303578	\N	\N	f
3716	2026-06-24	15:38:00	14160	69	201	243	\N	29	15	100	17830	2.632365e+06	2.632465e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-25 00:19:13.586009	\N	\N	f
3717	2026-06-24	16:06:00	14161	69	213	256	\N	29	15	100	1.372436e+06	2.632465e+06	2.632565e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-25 00:20:18.544188	\N	\N	f
3718	2026-06-24	16:24:00	14162	69	242	252	\N	29	15	100	3829	2.632565e+06	2.632665e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-25 00:20:43.126655	\N	\N	f
3719	2026-06-25	06:10:00	14109	69	244	253	163	30	16	60	150673	941278	941338	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-25 12:12:28.841276	253	253	t
3720	2026-06-25	06:12:00	14110	69	226	266	174	30	16	100	57481	941338	941438	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-25 12:16:13.575894	253	266	f
3721	2026-06-25	06:16:00	14111	69	229	269	174	30	16	100	793887	941438	941538	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-25 12:34:42.482732	253	269	f
3722	2026-06-25	06:34:00	14112	69	211	254	174	30	16	50	38188	941538	941588	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-25 12:51:36.61905	253	254	f
3723	2026-06-25	08:43:00	14113	69	208	250	146	30	16	100	1.034828e+06	941588	941688	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-25 14:45:25.199873	253	250	f
3724	2026-06-25	08:45:00	14114	69	214	257	146	30	16	100	69454	941688	941788	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-25 14:46:55.225392	253	257	f
3725	2026-06-25	08:46:00	14115	69	252	272	\N	30	16	100	5105	941788	941888	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-25 14:48:08.787806	253	272	f
3726	2026-06-25	12:03:00	14116	69	234	271	168	30	16	280	3813	941888	942168	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-25 18:06:00.188992	253	271	f
3727	2026-06-24	18:35:00	14164	69	255	248	\N	29	15	237	165	2.633486e+06	2.633723e+06	patio	normal	35 LITROS DE UREA, TANQUE LLENO DE DIESEL 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-25 23:54:14.476481	\N	\N	f
3730	2026-06-25	08:48:00	14167	69	206	241	\N	29	15	100	522685	2.633874e+06	2.633974e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-25 23:55:52.045335	\N	\N	f
3729	2026-06-25	07:50:00	14166	69	197	240	\N	29	15	50	27551	2.633824e+06	2.633874e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-25 23:55:25.08939	\N	\N	f
3728	2026-06-25	07:10:00	14165	69	205	247	\N	29	15	100	23116	2.633724e+06	2.633824e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-25 23:54:55.270509	\N	\N	f
3731	2026-06-25	09:00:00	14168	69	203	242	\N	29	15	120	130862	2.633974e+06	2.634094e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 00:11:35.779655	\N	\N	t
3732	2026-06-25	15:10:00	14169	69	204	246	\N	29	15	120	447386	2.634095e+06	2.634215e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 00:13:17.470584	\N	\N	f
3733	2026-06-25	15:45:00	14170	69	201	243	\N	29	15	100	18050	2.634215e+06	2.634315e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 00:16:21.939022	\N	\N	f
3734	2026-06-25	15:56:00	14171	69	211	254	\N	29	15	100	38328	2.634315e+06	2.634415e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 00:17:02.902398	\N	\N	f
3735	2026-06-25	16:05:00	14172	69	242	252	\N	29	15	100	4004	2.634415e+06	2.634515e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 00:17:56.394763	\N	\N	f
3736	2026-06-25	16:18:00	14173	69	213	256	\N	29	15	100	1.372628e+06	2.634515e+06	2.634615e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 00:21:50.519246	\N	\N	f
3737	2026-06-25	16:33:00	14174	69	202	244	\N	29	15	90	72601	2.634615e+06	2.634705e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 00:22:24.287586	\N	\N	f
3738	2026-06-25	16:38:00	14175	69	198	241	\N	29	15	70	83371	2.634705e+06	2.634775e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 00:22:50.75439	\N	\N	f
3739	2026-06-25	16:52:00	14176	69	206	267	\N	29	15	100	522877	2.634775e+06	2.634875e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 00:23:18.008938	\N	\N	f
3740	2026-06-26	07:16:00	14117	69	229	269	174	30	16	80	794118	942168	942248	campo	normal	Hora de carga 6.53	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-26 13:19:54.616609	253	269	f
3741	2026-06-26	10:55:00	14118	69	214	257	157	30	16	50	69700	942248	942298	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-26 16:57:51.20066	253	257	f
3742	2026-06-26	13:17:00	14119	69	216	259	138	30	16	67	5377	942298	942365	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-26 19:20:00.976496	253	259	f
3743	2026-06-26	14:40:00	14120	69	252	272	175	30	16	20	5450	942365	942385	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-26 20:42:59.506495	253	272	f
3744	2026-06-26	14:42:00	14122	69	203	242	175	30	16	32	131617	942385	942417	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-26 20:46:26.896017	253	242	f
3745	2026-06-26	14:46:00	14124	69	201	243	175	30	16	30	18268	942417	942447	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-26 20:55:18.50658	253	243	f
3746	2026-06-26	14:55:00	14125	69	208	250	175	30	16	20	1.035175e+06	942447	942467	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-26 21:31:13.565198	253	250	f
3747	2026-06-25	17:56:00	14178	69	209	251	\N	29	15	80	47627	2.635774e+06	2.635854e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 23:24:34.351899	\N	\N	f
3748	2026-06-26	08:00:00	14179	69	197	240	\N	29	15	80	27661	2.635854e+06	2.635934e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 23:27:26.670608	\N	\N	f
3749	2026-06-26	\N	\N	69	233	\N	154	31	\N	40	1629	\N	\N	externo	normal	[FOLIO 14180] 40 LITROS ARQ JOSE, MARAVILLAS\nFOLIO:; 14180	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 23:28:52.945067	\N	\N	f
3750	2026-06-26	\N	\N	69	241	\N	154	31	\N	40	\N	\N	\N	externo	normal	[Externo] 40 LITROS EN BOTES ARQ JOSE. FOLIO : 14180	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 23:29:20.621675	\N	\N	f
3751	2026-06-26	16:15:00	14180	69	229	269	\N	29	15	50	794278	2.636014e+06	2.636064e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 23:29:53.670235	\N	\N	f
3752	2026-06-26	16:20:00	14182	69	202	244	\N	29	15	1	72829	2.636064e+06	2.636065e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 23:30:30.553877	\N	\N	f
3753	2026-06-26	16:50:00	14183	69	204	246	\N	29	15	100	447623	2.636065e+06	2.636165e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-26 23:30:58.791196	\N	\N	f
3754	2026-06-26	17:02:00	14184	69	199	280	\N	29	15	1	142388	2.636165e+06	2.636166e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:27:47.323902	\N	\N	f
3755	2026-06-27	00:00:00	14185	71	199	280	\N	29	15	110	142388	2.636166e+06	2.636276e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:28:22.092551	\N	\N	f
3756	2026-06-27	00:00:00	14186	71	211	254	\N	29	15	1	38477	2.636277e+06	2.636278e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:28:59.650052	\N	\N	f
3757	2026-06-27	00:00:00	14187	71	211	254	\N	29	15	100	38477	2.636278e+06	2.636378e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:30:04.917883	\N	\N	f
3758	2026-06-26	17:45:00	14188	69	232	251	\N	29	15	100	483878	2.636379e+06	2.636479e+06	patio	normal	SE LLEVA EL CAMION JULIO, DEJA EL CA17 EN REPARACION DE MUELLE DELANTERA ROTA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:30:42.531406	\N	\N	f
3759	2026-06-26	18:14:00	14189	69	212	255	\N	29	15	16	698	2.636479e+06	2.636495e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:31:16.440358	\N	\N	f
3760	2026-06-27	10:00:00	14190	71	212	255	\N	29	15	100	698	2.636495e+06	2.636595e+06	patio	normal	CARGA POSTFECHADA , NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:31:45.086378	\N	\N	f
3761	2026-06-26	18:22:00	14191	69	242	252	\N	29	15	10	4248	2.636585e+06	2.636595e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:32:14.580191	\N	\N	f
3762	2026-06-27	00:00:00	14192	71	242	252	\N	29	15	100	4248	2.636595e+06	2.636695e+06	patio	normal	CARGA ´POSTFECHADA PARA SABADO, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:32:51.807439	\N	\N	f
3763	2026-06-26	18:33:00	14193	69	226	266	\N	29	15	50	57930	2.636695e+06	2.636745e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:33:17.889379	\N	\N	f
3764	2026-06-27	00:00:00	14194	71	226	266	\N	29	15	120	57930	2.636745e+06	2.636865e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:33:47.568726	\N	\N	f
3765	2026-06-26	18:47:00	14195	69	206	267	\N	29	15	10	523163	2.636865e+06	2.636875e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:34:19.754874	\N	\N	f
3766	2026-06-27	00:00:00	14196	71	232	267	\N	29	15	100	483878	2.636875e+06	2.636975e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 01:34:50.70171	\N	\N	f
3771	2026-06-27	07:30:00	14197	71	198	241	\N	29	15	100	83531	2.636977e+06	2.637077e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 14:54:53.076415	\N	\N	f
3772	2026-06-27	07:35:00	14198	71	205	247	\N	29	15	100	23480	2.637077e+06	2.637177e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 14:55:50.243258	\N	\N	f
3773	2026-06-27	08:00:00	14199	71	197	240	\N	29	15	120	27885	2.637177e+06	2.637297e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 14:56:25.305352	\N	\N	f
3775	2026-06-26	\N	\N	69	255	\N	162	31	\N	1	650	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 15:08:29.49365	\N	\N	f
3767	2026-06-27	07:55:00	14121	71	252	272	\N	30	16	100	5568	942467	942567	campo	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO, AUTORIZADO BETO N.	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-27 13:58:11.997219	253	272	f
3768	2026-06-27	07:58:00	14123	71	203	242	\N	30	16	100	131661	942567	942667	campo	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO, AUTORIZADO BETO N.	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-27 14:00:11.185249	253	242	f
3769	2026-06-27	08:00:00	14126	71	208	250	\N	30	16	100	1.035233e+06	942667	942767	campo	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO, AUTORIZADO BETO N.	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-27 14:01:36.870044	253	250	f
3770	2026-06-27	08:01:00	14127	71	201	243	145	30	16	100	18346	942767	942867	campo	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO, AUTORIZADO BETO N.	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-27 14:03:37.680598	253	243	f
3777	2026-06-26	\N	\N	69	197	\N	162	31	\N	1	27885	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 15:41:50.813882	\N	\N	f
3778	2026-06-26	\N	\N	69	205	\N	162	31	\N	1	23480	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 15:43:26.91769	\N	\N	f
3708	2026-06-24	17:42:00	14104	69	253	274	138	30	16	75	3661.2	940806	940881	campo	normal	Tsnsue lleno hora de carga2.40 pm	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-24 23:45:11.921896	253	274	f
3779	2026-06-26	\N	\N	69	213	\N	162	31	\N	1	1.372788e+06	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 16:18:29.518324	\N	\N	f
3780	2026-06-26	\N	\N	69	215	\N	162	31	\N	1	48432	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 16:30:26.219631	\N	\N	f
3781	2026-06-26	\N	\N	69	214	\N	162	31	\N	1	69831	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 16:55:23.33521	\N	\N	f
3782	2026-06-26	\N	\N	69	209	\N	162	31	\N	1	47781	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 17:19:23.116984	\N	\N	f
3774	2026-06-26	\N	\N	69	208	\N	162	31	\N	1	1.035178e+06	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 15:07:48.752707	\N	\N	f
3783	2026-06-26	\N	\N	69	228	\N	162	31	\N	1	9033	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 17:43:28.426738	\N	\N	f
3784	2026-06-26	\N	\N	69	198	\N	162	31	\N	1	83531	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 17:44:10.739939	\N	\N	f
3776	2026-06-26	\N	\N	69	226	\N	162	31	\N	1	57831	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 15:12:36.374294	\N	\N	f
3785	2026-06-27	11:42:00	14252	71	215	258	\N	29	15	130	48542	2.638026e+06	2.638156e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:08:40.672104	\N	\N	f
3786	2026-06-27	11:53:00	14253	71	214	257	\N	29	15	120	69930	2.638156e+06	2.638276e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:09:44.321804	\N	\N	f
3787	2026-06-27	12:05:00	14254	71	229	269	\N	29	15	100	794429	2.638276e+06	2.638376e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:10:29.106894	\N	\N	f
3788	2026-06-27	12:15:00	14256	71	202	244	\N	29	15	100	73009	2.638376e+06	2.638476e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:10:51.925887	\N	\N	f
3789	2026-06-27	12:25:00	14257	71	255	248	\N	29	15	150	814	2.638476e+06	2.638626e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:11:39.415319	\N	\N	f
3790	2026-06-27	12:41:00	14258	71	206	267	\N	29	15	50	523321	2.638626e+06	2.638676e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:12:43.877829	\N	\N	f
3791	2026-06-27	12:46:00	14259	71	242	252	\N	29	15	60	4420	2.638676e+06	2.638736e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:13:12.217341	\N	\N	f
3792	2026-06-27	12:55:00	14260	71	212	255	\N	29	15	50	802	2.638736e+06	2.638786e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:13:35.723768	\N	\N	f
3793	2026-06-27	13:11:00	14262	71	213	256	\N	29	15	100	1.372922e+06	2.638786e+06	2.638886e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:14:10.301625	\N	\N	f
3794	2026-06-27	13:21:00	14263	71	228	268	\N	29	15	100	9114	2.638887e+06	2.638987e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:14:33.640067	\N	\N	f
3795	2026-06-27	13:33:00	14264	71	232	251	\N	29	15	50	484034	2.638987e+06	2.639037e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 20:15:13.626389	\N	\N	f
3796	2026-06-29	06:11:00	14128	71	244	253	163	30	16	53	150673	942867	942920	campo	normal	Km 160435  tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-29 12:14:09.390545	253	253	t
3797	2026-06-29	08:14:00	14129	71	234	271	168	30	16	272	3830.1	942920	943192	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-29 14:17:21.424331	253	271	f
3798	2026-06-29	10:57:00	14130	71	252	272	138	30	16	120	5805	943192	943312	campo	normal	Hora de carga 9.15 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-29 16:59:54.892895	253	272	f
3799	2026-06-29	12:42:00	14131	71	226	266	146	30	16	120	58255	943312	943432	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-29 18:44:35.935866	253	266	f
3800	2026-06-27	14:11:00	14265	71	201	243	\N	29	15	50	18434	2.639038e+06	2.639088e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-29 23:44:16.786929	\N	\N	f
3801	2026-06-29	20:30:00	14266	71	208	250	\N	29	15	100	1.035363e+06	2.639088e+06	2.639188e+06	patio	normal	SALE RECIEN REPARADO DE SOPORTE Y TORNILLO DE CENTRO MUELLES DELANTERAS DE LADO DE CHOFER\n	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-29 23:45:25.206713	\N	\N	f
3802	2026-06-29	17:46:00	12467	71	203	250	\N	29	15	120	131831	2.639189e+06	2.639309e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-29 23:46:31.769329	\N	\N	f
3804	2026-06-29	15:12:00	14286	71	201	243	\N	29	15	120	18644	2.639309e+06	2.639429e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-29 23:48:44.866314	\N	\N	f
3805	2026-06-29	15:38:00	14269	71	213	256	\N	29	15	100	1.373154e+06	2.639429e+06	2.639529e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-29 23:49:26.456374	\N	\N	f
3806	2026-06-29	15:53:00	14270	71	229	269	\N	29	15	70	794595	2.639533e+06	2.639603e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-29 23:49:57.37576	\N	\N	f
3807	2026-06-29	16:13:00	14271	71	199	280	\N	29	15	120	142821	2.639603e+06	2.639723e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-29 23:50:29.194925	\N	\N	f
3808	2026-06-29	16:35:00	14272	71	206	267	\N	29	15	100	523612	2.639723e+06	2.639823e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-29 23:51:01.658155	\N	\N	f
3809	2026-06-29	16:41:00	14273	71	214	269	\N	29	15	80	70212	2.639823e+06	2.639903e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-29 23:52:48.653675	\N	\N	f
3810	2026-06-29	16:51:00	14274	71	232	239	\N	29	15	50	484324	2.639903e+06	2.639953e+06	patio	normal	deja peludo el camion, agarra el 17	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-30 00:14:19.33131	\N	\N	f
3811	2026-06-29	17:19:00	14275	71	209	251	\N	29	15	100	47781	2.639953e+06	2.640053e+06	patio	normal	SALE RECIEN REPARADO, MUELLE NUEVA DELANTERA, BUJES, SELLOS DE CAJA DE DIRECCION, MANTENIMIENTO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-30 00:15:52.715361	\N	\N	f
3812	2026-06-29	17:29:00	14276	71	205	247	\N	29	15	120	23798	2.640053e+06	2.640173e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-30 00:16:16.371995	\N	\N	f
3813	2026-06-29	17:38:00	14277	71	202	244	\N	29	15	100	73269	2.640173e+06	2.640273e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-30 00:28:44.685795	\N	\N	f
3814	2026-06-29	17:50:00	14278	71	211	254	\N	29	15	120	38771	2.640273e+06	2.640393e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-30 00:29:18.615738	\N	\N	f
3815	2026-06-29	18:05:00	14279	71	228	268	\N	29	15	100	9349	2.640393e+06	2.640493e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-30 00:29:53.913402	\N	\N	f
3816	2026-06-29	18:13:00	14280	71	204	246	\N	29	15	130	447999	2.640494e+06	2.640624e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-30 00:30:36.316662	\N	\N	f
3817	2026-06-30	06:28:00	14132	71	198	241	146	30	16	100	83777	943432	943532	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-30 12:30:19.348463	253	241	f
3818	2026-06-30	10:06:00	14133	71	252	272	157	30	16	120	6057	943532	943652	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-30 17:04:18.050845	253	272	f
3819	2026-06-30	12:57:00	14134	71	208	250	176	30	16	100	1.03566e+06	943652	943752	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-30 19:00:28.011227	253	250	f
3820	2026-06-30	13:00:00	14135	71	216	259	138	30	16	92	5390	943752	943844	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-06-30 19:38:24.697139	253	259	f
3821	2026-06-29	18:25:00	14282	71	212	255	\N	29	15	100	1054	2.640624e+06	2.640724e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:45:17.124023	\N	\N	f
3822	2026-06-29	18:41:00	14283	71	255	248	\N	29	15	100	1112	2.640724e+06	2.640824e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:46:17.381511	\N	\N	f
3823	2026-06-30	20:49:00	14284	71	218	239	\N	29	15	14	1459.7	2.640844e+06	2.640858e+06	patio	normal	SALE A ARBOLEDA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:47:13.6436	\N	\N	f
3824	2026-06-30	20:50:00	14285	71	232	255	\N	29	15	100	484325	2.640858e+06	2.640958e+06	patio	normal	SE LLEVA FRANCISCO CA13 , DEJA CA15 FALLA DE CLUTCH	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:48:15.725458	\N	\N	f
3825	2026-06-30	22:45:00	142866	71	256	239	\N	29	15	130	7204	2.640859e+06	2.640989e+06	patio	normal	SALE A OBRA, JAVIER PELON SE LA LLEVA, MANTENIMIENTO A LAS 7150	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:50:37.43871	\N	\N	f
3826	2026-06-30	13:50:00	14287	71	241	239	\N	29	15	40	19345	2.64097e+06	2.64101e+06	patio	normal	PASO ARQ JAVIER POR 20 LITROS PARA PLANTA + 20 LITROS PARA RETRO R04	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:51:54.173982	\N	\N	f
3827	2026-06-30	13:59:00	1428677	71	233	239	\N	29	15	20	1629	2.64109e+06	2.64111e+06	patio	normal	PASO ARQ JAVIER POR 20 LITROS PARA PLANTA + 20 LITROS PARA RETRO R04	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:52:25.916647	\N	\N	f
3828	2026-06-30	16:17:00	14289	71	201	243	\N	29	15	120	18864	2.642106e+06	2.642226e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:54:17.606855	\N	\N	f
3829	2026-06-30	16:30:00	14290	71	214	257	\N	29	15	100	70426	2.642227e+06	2.642327e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:54:50.333408	\N	\N	f
3830	2026-06-30	16:41:00	14291	71	205	247	\N	29	15	80	23945	2.642327e+06	2.642407e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:55:30.327174	\N	\N	f
3831	2026-06-30	16:50:00	14292	71	213	256	\N	29	15	100	1.373341e+06	2.642407e+06	2.642507e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:56:20.222792	\N	\N	f
3832	2026-06-30	17:06:00	14293	71	211	254	\N	29	15	100	38937	2.642507e+06	2.642607e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:56:53.907145	\N	\N	f
3833	2026-06-30	17:15:00	14294	71	202	244	\N	29	15	100	73493	2.642607e+06	2.642707e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:57:22.280857	\N	\N	f
3834	2026-06-30	17:23:00	14295	71	206	267	\N	29	15	100	523880	2.642707e+06	2.642807e+06	patio	normal	HOY SE LE PUSIERON 2 GALLOS Y SE PARCHO UNA LLANTA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:58:19.181256	\N	\N	f
3835	2026-06-30	17:32:00	14296	71	228	268	\N	29	15	100	9632	2.642807e+06	2.642907e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:58:49.816579	\N	\N	f
3836	2026-06-30	17:41:00	14297	71	199	280	\N	29	15	120	143098	2.642908e+06	2.643028e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 01:59:55.057142	\N	\N	f
3837	2026-06-30	17:59:00	14298	71	204	246	\N	29	15	39	448289	2.643028e+06	2.643067e+06	patio	normal	TANQUE VACIO TALLER\n	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 02:00:33.499558	\N	\N	f
3838	2026-07-01	07:16:00	14136	71	255	248	145	30	16	120	1473	943844	943964	campo	normal	Hora de carga 6.09 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-01 13:19:45.927254	253	248	f
3839	2026-07-01	07:19:00	14137	71	226	266	146	30	16	120	58547	943964	944084	campo	normal	Hora de carga 6.47 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-01 13:23:01.315404	253	266	f
3840	2026-07-01	07:23:00	14138	71	204	246	146	30	16	120	448323	944084	944204	campo	normal	Hora de carga 6.54 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-01 13:25:23.687333	253	246	f
3841	2026-07-01	07:25:00	14139	71	229	269	146	30	16	120	794938	944204	944324	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-01 13:29:02.496724	253	269	f
3842	2026-07-01	09:45:00	14140	71	215	258	145	30	16	120	48974	944324	944444	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-01 15:49:55.496599	253	258	f
3843	2026-07-01	09:49:00	14141	71	252	272	145	30	16	100	6248	944444	944544	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-01 15:52:46.714935	253	272	f
3844	2026-07-01	09:52:00	14142	71	209	251	145	30	16	100	48064	944544	944644	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-01 15:54:41.558689	253	251	f
3845	2026-07-01	09:54:00	14143	71	197	240	145	30	16	100	28112	944644	944744	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-01 15:56:41.196019	253	240	f
3846	2026-07-01	10:53:00	14144	71	203	242	157	30	16	120	132325	944744	944864	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-01 16:55:00.583452	253	242	f
3847	2026-07-01	14:10:00	14299	71	205	247	\N	29	15	80	23945	2.643067e+06	2.643145e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 22:08:50.94484	\N	\N	f
3848	2026-07-01	15:55:00	14300	71	213	256	\N	29	15	60	1.373474e+06	2.643147e+06	2.643207e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 22:09:18.508693	\N	\N	f
3849	2026-07-01	16:04:00	13951	71	228	268	\N	29	15	100	9826	2.643207e+06	2.643307e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 23:39:22.660596	\N	\N	f
3850	2026-07-01	16:40:00	13952	71	245	279	\N	29	15	80	564281	2.643307e+06	2.643387e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 23:40:06.929208	\N	\N	f
3851	2026-07-01	16:22:00	13953	71	214	257	\N	29	15	100	70552	2.643387e+06	2.643487e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 23:45:25.462358	\N	\N	f
3852	2026-07-01	16:36:00	13954	71	202	244	\N	29	15	100	73638	2.643488e+06	2.643588e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 23:46:00.081379	\N	\N	f
3853	2026-07-01	16:56:00	13955	71	211	254	\N	29	15	100	39134	2.643588e+06	2.643688e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 23:46:19.841449	\N	\N	f
3854	2026-07-01	17:22:00	13956	71	229	269	\N	29	15	100	795065	2.643688e+06	2.643788e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-01 23:46:41.3893	\N	\N	f
3855	2026-07-02	08:12:00	14145	71	206	267	174	30	16	100	524115	944864	944964	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 14:15:30.273916	253	267	f
3856	2026-07-02	08:15:00	14146	71	199	280	174	30	16	120	143380	944964	945084	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 14:17:01.026961	253	280	f
3857	2026-07-02	08:17:00	14147	71	232	255	174	30	16	100	484686	945084	945184	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 14:40:48.609959	253	255	f
3858	2026-07-02	08:40:00	14148	71	255	248	174	30	16	100	1702	945184	945284	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 14:43:19.931122	253	248	f
3859	2026-07-02	08:43:00	14149	71	209	251	174	30	16	100	48245	945284	945384	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 14:44:47.902101	253	251	f
3904	2026-07-03	\N	\N	73	252	\N	162	31	\N	1	6794	\N	\N	externo	normal	[Externo] 1 CUARTO DE DIESEL	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 16:45:13.155168	\N	\N	f
3860	2026-07-02	08:44:00	159141	71	244	253	146	30	16	67	150673	945384	945451	campo	normal	Km 161190 tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 14:46:59.130533	253	253	t
3861	2026-07-02	09:33:00	11701	71	198	241	157	30	16	100	84028	945451	945551	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 15:34:58.032256	253	241	f
3862	2026-07-02	10:55:00	11702	71	226	266	157	30	16	110	58871	945551	945661	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 16:57:14.814504	253	266	f
3863	2026-07-02	13:54:00	11703	71	203	242	157	30	16	100	132617	945661	945761	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 19:58:06.644855	253	242	f
3864	2026-07-02	13:58:00	11704	71	201	243	157	30	16	100	19297	945761	945861	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 19:59:20.394082	253	243	f
3865	2026-07-02	07:10:00	13958	71	215	258	\N	29	15	70	49115	2.644799e+06	2.644869e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-02 22:39:46.487987	\N	\N	f
3866	2026-07-02	08:00:00	13959	71	208	250	\N	29	15	130	1.035947e+06	2.644869e+06	2.644999e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-02 22:40:33.622622	\N	\N	f
3867	2026-07-02	17:45:00	11705	71	204	246	136	30	16	120	448684	945861	945981	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 23:47:08.792322	253	246	f
3868	2026-07-02	17:47:00	11706	71	229	269	136	30	16	50	795257	945981	946031	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 23:48:39.196014	253	269	f
3869	2026-07-02	17:48:00	11707	71	211	254	136	30	16	100	39331	946031	946131	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 23:50:01.389182	253	254	f
3870	2026-07-02	17:50:00	14708	71	214	257	136	30	16	50	70727	946131	946181	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 23:51:26.448599	253	257	f
3871	2026-07-02	17:51:00	11709	71	202	244	136	30	16	90	73827	946181	946271	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 23:52:42.320194	253	244	f
3872	2026-07-02	17:52:00	11710	71	199	280	136	30	16	60	143585	946271	946331	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 23:54:08.841424	253	280	f
3873	2026-07-02	17:54:00	14711	71	228	268	136	30	16	50	10043	946331	946381	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 23:55:35.200565	253	268	f
3874	2026-07-02	17:55:00	11712	71	205	247	136	30	16	100	24321	946381	946481	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 23:56:50.767757	253	247	f
3875	2026-07-02	17:56:00	11713	71	213	256	136	30	16	100	1.373644e+06	946481	946581	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-02 23:58:02.644359	253	256	f
3876	2026-07-03	07:04:00	11714	71	209	251	145	30	16	98	48506	946581	946679	campo	normal	Hora de carga 6.22 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-03 13:07:56.02361	253	251	f
3877	2026-07-03	07:07:00	11715	71	252	272	146	30	16	100	6613	946679	946779	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-03 13:09:39.750645	253	272	f
3878	2026-07-03	09:56:00	11716	71	216	259	138	30	16	90	5407	946779	946869	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-03 15:58:17.232452	253	259	f
3879	2026-07-03	09:58:00	11717	71	217	260	138	30	16	17	1048.1	946869	946886	campo	normal	Tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-03 16:00:34.49537	253	260	f
3880	2026-07-03	11:40:00	11718	71	208	250	146	30	16	85	1.036222e+06	946886	946971	campo	normal	Tanque bacio nissan	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-03 17:47:28.346496	253	250	f
3881	2026-07-02	18:40:00	13961	71	255	248	\N	29	15	60	1932	2.645994e+06	2.646054e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-03 22:53:32.894862	\N	\N	f
3882	2026-07-03	07:10:00	13962	71	197	240	\N	29	15	75	28428	2.646054e+06	2.646129e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-03 22:53:59.652406	\N	\N	f
3884	2026-07-03	\N	\N	71	241	\N	154	31	\N	20	0	\N	\N	externo	normal	[Externo] FOLIO 13963 20 LITROS EN YOGA CON LUIS FLACO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-03 22:55:26.625564	\N	\N	f
3885	2026-07-03	15:49:00	13966	71	215	258	\N	29	15	30	49436	2.647336e+06	2.647366e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-03 22:56:35.059019	\N	\N	f
3886	2026-07-03	16:20:00	13968	71	201	243	\N	29	15	50	19693	2.647486e+06	2.647536e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-03 22:57:24.837241	\N	\N	f
3887	2026-07-03	16:56:00	11719	71	218	274	177	30	16	32	1485.3	946971	947003	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-03 23:39:29.847668	253	274	f
3888	2026-07-04	12:00:00	13967	72	215	258	\N	29	15	120	49436	2.64736e+06	2.64748e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 00:58:43.648273	\N	\N	f
3889	2026-07-03	17:54:00	13979	71	232	255	\N	29	15	1	485040	2.647481e+06	2.647482e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 00:59:15.367635	\N	\N	f
3890	2026-07-04	12:00:00	13980	72	232	269	\N	29	15	120	485043	2.647482e+06	2.647602e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL BAJO\nDEJA FRANCISCO CAMION PARA QUE SE LO LLEVE MEDINA, CA26 EN REPARACION DE VALVULA DE AIRE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 01:00:02.774187	\N	\N	f
3891	2026-07-03	18:09:00	13981	71	226	266	\N	29	15	1	59224	2.648403e+06	2.648404e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 01:00:49.166639	\N	\N	f
3892	2026-07-04	12:00:00	13982	72	226	266	\N	29	15	130	59224	2.648404e+06	2.648534e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 01:01:10.9162	\N	\N	f
3893	2026-07-04	10:16:00	11720	72	214	257	145	30	16	100	71061	947003	947103	campo	normal	Hora de carga  6.01 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-04 16:19:13.251714	253	257	f
3894	2026-07-04	10:19:00	11721	72	255	248	145	30	16	100	2246	947103	947203	campo	normal	Hora de carga 6.15 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-04 16:21:01.679709	253	248	f
3895	2026-07-04	10:21:00	11722	72	201	243	145	30	16	100	19719	947203	947303	campo	normal	Hora de carga 6.30 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-04 16:22:48.204657	253	243	f
3896	2026-07-04	10:22:00	11723	72	205	247	145	30	16	100	24480	947303	947403	campo	normal	Hora de carga 6.45 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-04 16:24:35.680706	253	247	f
3897	2026-07-04	10:24:00	11724	72	209	251	145	30	16	100	48679	947403	947503	campo	normal	Hora de carga 6.57 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-04 16:26:42.421641	253	251	f
3898	2026-07-04	10:26:00	11725	72	198	241	146	30	16	100	84261	947503	947603	campo	normal	Hira de carga 7.28 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-04 16:28:13.84894	253	241	f
3899	2026-07-04	10:28:00	11726	72	203	242	178	30	16	120	132963	947603	947723	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-04 16:30:24.041244	253	242	f
3900	2026-07-04	10:30:00	11727	72	202	244	178	30	16	100	74126	947723	947823	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-04 16:36:07.207819	253	244	f
3901	2026-07-04	10:36:00	11728	72	208	250	178	30	16	70	1.036348e+06	947823	947893	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-04 16:37:59.552057	253	250	f
3902	2026-07-04	00:00:00	13983	72	213	256	\N	29	15	100	1.373956e+06	2.648534e+06	2.648634e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 16:42:07.040422	\N	\N	f
3903	2026-07-04	10:40:00	159142	72	256	262	178	30	16	119	7229	947893	948012	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-04 16:42:18.162974	253	262	f
3883	2026-07-03	08:40:00	13963	71	233	264	\N	29	15	40	1652	2.646129e+06	2.646169e+06	patio	normal	MANDAMOS YOGAS CON FLACO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-03 22:54:51.822494	\N	\N	f
3905	2026-07-03	\N	\N	71	208	\N	162	31	\N	1	1.036269e+06	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 16:45:51.130001	\N	\N	f
3906	2026-07-03	\N	\N	71	203	\N	162	31	\N	1	132880	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 16:59:53.144489	\N	\N	f
3907	2026-07-03	\N	\N	71	214	\N	162	31	\N	1	71047	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:00:53.763217	\N	\N	f
3908	2026-07-03	\N	\N	71	202	\N	162	31	\N	1	74037	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:01:58.608035	\N	\N	f
3909	2026-07-03	\N	\N	71	205	\N	162	31	\N	1	24469	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:03:11.438073	\N	\N	f
3910	2026-07-03	\N	\N	71	255	\N	162	31	\N	1	2229	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:39:06.323786	\N	\N	f
3911	2026-07-03	\N	\N	71	213	\N	162	31	\N	1	1.373956e+06	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:40:34.005673	\N	\N	f
3912	2026-07-03	\N	\N	71	197	\N	162	31	\N	1	28620	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:42:00.821989	\N	\N	f
3913	2026-07-03	16:31:00	13969	71	229	269	\N	29	15	100	795565	2.647548e+06	2.647648e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:50:19.209912	\N	\N	f
3914	2026-07-03	16:39:00	13970	71	204	246	\N	29	15	130	448983	2.647648e+06	2.647778e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:50:55.333583	\N	\N	f
3915	2026-07-03	16:30:00	13971	71	206	267	\N	29	15	10	524396	2.647779e+06	2.647789e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:52:32.197308	\N	\N	f
3916	2026-07-04	00:00:00	13972	72	206	267	\N	29	15	100	524396	2.647789e+06	2.647889e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:53:13.140872	\N	\N	f
3917	2026-07-03	17:02:00	13973	71	211	254	\N	29	15	30	39639	2.647889e+06	2.647919e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:53:37.506389	\N	\N	f
3918	2026-07-04	00:00:00	13974	72	211	254	\N	29	15	100	39639	2.647919e+06	2.648019e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:54:01.593735	\N	\N	f
3919	2026-07-03	17:18:00	13975	71	228	268	\N	29	15	20	10399	2.64802e+06	2.64804e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:55:19.429137	\N	\N	f
3920	2026-07-04	00:00:00	13976	72	228	268	\N	29	15	100	10399	2.64804e+06	2.64814e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:55:37.765016	\N	\N	f
3921	2026-07-03	17:40:00	13977	71	199	280	\N	29	15	20	144000	2.648141e+06	2.648161e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:56:07.574746	\N	\N	f
3922	2026-07-04	00:00:00	13978	72	199	280	\N	29	15	120	144000	2.648161e+06	2.648281e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:56:29.716654	\N	\N	f
3923	2026-07-04	07:59:00	13984	72	197	240	\N	29	15	120	28620	2.648635e+06	2.648755e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:57:05.510214	\N	\N	f
3924	2026-07-04	08:30:00	13985	72	227	279	\N	29	15	70	452639	2.648755e+06	2.648825e+06	patio	normal	SALE A ARREGLAR CLIMA	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:57:41.875905	\N	\N	f
3925	2026-07-03	\N	\N	71	198	\N	162	31	\N	1	84269	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 17:58:55.32352	\N	\N	f
3926	2026-07-03	\N	\N	71	209	\N	162	31	\N	1	48655	\N	\N	externo	normal	[Externo]	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 18:07:17.278085	\N	\N	f
3927	2026-07-04	12:55:00	13987	72	208	250	\N	29	15	100	1.036415e+06	2.649897e+06	2.649997e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 19:48:00.28552	\N	\N	f
3928	2026-07-06	13:07:00	13988	72	213	256	\N	29	15	100	1.374163e+06	2.649998e+06	2.650098e+06	patio	normal	CARGA POSTFECHADA PARA EL LUNES. NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 19:49:11.255397	\N	\N	f
3929	2026-07-04	13:27:00	13989	72	209	251	\N	29	15	50	48806	2.650098e+06	2.650148e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 19:49:36.4399	\N	\N	f
3930	2026-07-04	13:36:00	13990	72	252	272	\N	29	15	120	6961	2.650148e+06	2.650268e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 19:50:02.089429	\N	\N	f
3803	2026-06-29	17:46:00	12467	71	203	242	\N	29	15	120	131831	2.639189e+06	2.639309e+06	patio	normal	SE CAMBIA VALVULA REPARTIDORA DE AIRE\n	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-29 23:47:21.742441	\N	\N	f
3931	2026-07-06	07:06:00	11730	72	197	240	146	30	16	100	28833	948012	948112	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-06 13:08:00.496682	253	240	f
3932	2026-07-06	08:55:00	11731	72	244	253	145	30	16	67	150673	948112	948179	campo	normal	Km 161932 tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-06 14:57:48.061579	253	253	t
3933	2026-07-06	08:57:00	11732	72	226	266	145	30	16	120	59402	948179	948299	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-06 16:42:06.681846	253	266	f
3934	2026-07-06	10:42:00	11733	72	211	254	142	30	16	100	39889	948299	948399	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-06 16:43:26.268007	253	254	f
3935	2026-07-04	14:12:00	13991	72	227	267	\N	29	15	100	452692	2.650269e+06	2.650369e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 21:41:52.086741	\N	\N	f
3936	2026-07-04	15:41:00	13992	72	212	255	\N	29	15	100	1294	2.650369e+06	2.650469e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 21:42:54.110424	\N	\N	f
3937	2026-07-04	16:04:00	13993	72	206	239	\N	29	15	100	524493	2.65047e+06	2.65057e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 21:44:01.828024	\N	\N	f
3939	2026-07-06	\N	\N	72	241	\N	154	31	\N	20	\N	\N	\N	externo	normal	[Externo] folio 13994 3 botes alain	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 21:45:48.992199	\N	\N	f
3940	2026-07-06	11:29:00	13995	72	207	279	\N	29	15	100	486118	2.650669e+06	2.650769e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 22:26:09.805665	\N	\N	f
3941	2026-07-06	15:25:00	13996	72	214	257	\N	29	15	120	71344	2.650769e+06	2.650889e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 22:26:40.49909	\N	\N	f
3942	2026-07-06	15:43:00	13997	72	215	258	\N	29	15	120	49829	2.650889e+06	2.651009e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 22:27:16.753533	\N	\N	f
3943	2026-07-06	16:00:00	13998	72	228	268	\N	29	15	120	10766	2.651009e+06	2.651129e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 22:27:41.854221	\N	\N	f
3944	2026-07-06	16:09:00	13999	72	202	244	\N	29	15	100	74379	2.651129e+06	2.651229e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 22:28:05.230912	\N	\N	f
3945	2026-07-06	16:18:00	14000	72	212	255	\N	29	15	100	1487	2.651229e+06	2.651329e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 22:28:47.710504	\N	\N	f
3938	2026-07-06	09:02:00	13994	72	233	239	\N	29	15	40	1652	2.65057e+06	2.65063e+06	patio	normal	viene alain por 3 botes,  20litros son para la planta verde de maravillas	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-06 21:44:58.974754	\N	\N	f
3946	2026-07-06	16:34:00	11734	72	204	246	151	30	16	120	449295	948399	948519	campo	normal	Hora de carga 1.42 pm	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-06 22:36:27.875548	253	246	f
3947	2026-07-06	16:36:00	11735	72	203	242	157	30	16	100	133216	948519	948619	campo	normal	Hora de carga 3.47 ñm	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-06 22:38:21.189608	253	242	f
3948	2026-07-06	16:27:00	14302	72	201	243	\N	29	15	150	19861	2.65133e+06	2.65148e+06	patio	normal	NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 00:05:32.957291	\N	\N	f
3949	2026-07-06	17:12:00	14303	72	213	256	\N	29	15	100	1.374341e+06	2.65148e+06	2.65158e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 00:06:14.738605	\N	\N	f
3950	2026-07-06	17:22:00	14304	72	206	281	\N	29	15	100	524672	2.651581e+06	2.651681e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 00:08:12.100039	\N	\N	f
3951	2026-07-06	17:35:00	14305	72	199	280	\N	29	15	110	144350	2.651681e+06	2.651791e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 00:11:57.027991	\N	\N	f
3952	2026-07-06	17:48:00	14306	72	209	251	\N	29	15	110	49098	2.651791e+06	2.651901e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 00:12:20.878843	\N	\N	f
3953	2026-07-07	07:47:00	11736	72	216	259	138	30	16	90	5424	948619	948709	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-07 13:48:58.344552	253	259	f
3954	2026-07-07	07:48:00	11737	72	198	241	146	30	16	100	84517	948709	948809	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-07 13:50:17.829091	253	241	f
3955	2026-07-07	07:50:00	11738	72	255	248	145	30	16	100	2567	948809	948909	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-07 13:51:28.323908	253	248	f
3956	2026-07-07	07:51:00	11739	72	226	266	179	30	16	110	59617	948909	949019	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-07 15:21:13.615116	253	266	f
3957	2026-07-07	11:02:00	11740	72	197	240	179	30	16	95	29136	949019	949114	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-07 17:03:29.377495	253	240	f
3960	2026-07-07	19:55:00	14309	72	208	250	\N	29	15	100	1.036561e+06	2.652062e+06	2.652162e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:23:20.650745	\N	\N	f
3959	2026-07-06	18:08:00	14308	72	211	254	\N	29	15	60	40018	2.652002e+06	2.652062e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:22:36.611119	\N	\N	f
3958	2026-07-06	17:59:00	14307	72	232	269	\N	29	15	100	485325	2.651901e+06	2.652001e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:22:07.236087	\N	\N	f
3961	2026-07-07	08:00:00	14310	72	252	272	\N	29	15	261	7124	2.652162e+06	2.652423e+06	patio	normal	PRUEBA DE RENDIMIENTO (1)	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:31:13.271758	\N	\N	f
3962	2026-07-07	10:00:00	14311	72	241	239	\N	29	15	42	0	2.652423e+06	2.652465e+06	patio	normal	MARAVILLAS VINO ALAIN POR DOS BOTES	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:32:09.15843	\N	\N	t
3963	2026-07-07	12:30:00	14312	72	236	239	\N	29	15	8	1355	2.652466e+06	2.652474e+06	patio	normal	SALE A OBRA LOS PUERTOS CON ARQ JOSE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:33:14.146946	\N	\N	f
3964	2026-07-07	12:40:00	14313	72	229	267	\N	29	15	101	795565	2.652474e+06	2.652575e+06	patio	normal	SALE RECIEN REPARADO DE EMPAQUE DEL TURBO Y REPUESTO INTERNO DE VALVULA DE AIRE	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:34:13.6766	\N	\N	f
3965	2026-07-07	15:40:00	14314	72	252	272	\N	29	15	60	7287	2.652575e+06	2.652635e+06	patio	normal	PRUEBA DE RENDIMIENTO (2)	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:35:07.191789	\N	\N	f
3966	2026-07-07	15:48:00	14315	72	201	243	\N	29	15	80	20076	2.652635e+06	2.652715e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:36:09.278375	\N	\N	f
3967	2026-07-07	15:59:00	14316	72	215	258	\N	29	15	80	50000	2.652716e+06	2.652796e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:37:09.028901	\N	\N	f
3968	2026-07-07	16:07:00	14317	72	214	257	\N	29	15	100	71530	2.652796e+06	2.652896e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:37:37.539393	\N	\N	f
3969	2026-07-07	16:15:00	14318	72	204	246	\N	29	15	120	449481	2.652896e+06	2.653016e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:38:07.533994	\N	\N	f
3970	2026-07-07	16:26:00	14319	72	211	254	\N	29	15	100	40192	2.653016e+06	2.653116e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:45:04.610383	\N	\N	f
3971	2026-07-07	16:35:00	14321	72	202	244	\N	29	15	100	74587	2.653116e+06	2.653216e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:52:25.233037	\N	\N	f
3972	2026-07-07	16:46:00	14322	72	228	268	\N	29	15	100	10974	2.653217e+06	2.653317e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:52:56.888441	\N	\N	f
3973	2026-07-07	17:00:00	14323	72	199	280	\N	29	15	130	144583	2.653317e+06	2.653447e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:53:51.916406	\N	\N	f
3974	2026-07-07	17:10:00	14324	72	209	251	\N	29	15	110	49349	2.653447e+06	2.653557e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-07 23:54:26.308265	\N	\N	f
3975	2026-07-07	17:25:00	14325	72	212	255	\N	29	15	100	1725	2.653557e+06	2.653657e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 16:16:13.314942	\N	\N	f
3976	2026-07-07	17:38:00	14326	72	213	256	\N	29	15	60	1.374578e+06	2.653658e+06	2.653718e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 16:17:08.055915	\N	\N	f
3977	2026-07-07	17:45:00	14327	72	206	281	\N	29	15	50	524794	2.653718e+06	2.653768e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 16:17:52.635559	\N	\N	f
3978	2026-07-07	17:56:00	14328	72	255	248	\N	29	15	100	2786	2.653769e+06	2.653869e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 16:18:31.172802	\N	\N	f
3979	2026-07-08	07:05:00	14330	72	208	250	\N	29	15	50	1.036701e+06	2.655013e+06	2.655063e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 16:20:36.944369	\N	\N	f
3980	2026-07-08	10:33:00	11741	72	197	240	146	30	16	100	29357	949114	949214	campo	normal	Hora de carga 9.08 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-08 16:36:16.904572	253	240	f
3981	2026-07-08	12:23:00	11742	72	203	242	157	30	16	100	133506	949214	949314	campo	normal	Hora de carga 11.33 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-08 18:25:14.513284	253	242	f
3982	2026-07-08	12:25:00	11743	72	198	241	157	30	16	100	84790	949314	949414	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-08 18:26:50.372116	253	241	f
3983	2026-07-08	12:26:00	11744	72	226	266	157	30	16	100	59969	949414	949514	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-08 18:27:55.325585	253	266	f
3984	2026-07-08	15:19:00	11745	72	256	262	179	30	16	108	7250	949514	949622	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-08 21:20:50.211736	253	262	f
3985	2026-07-08	11:00:00	14331	72	220	239	\N	29	15	20	19051	2.655062e+06	2.655082e+06	patio	normal	HOROMETRO 0	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 22:29:41.788043	\N	\N	f
3986	2026-07-08	16:53:00	11746	72	216	259	138	30	16	88	5439	949622	949710	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-08 22:54:58.815228	253	259	f
3987	2026-07-08	14:30:00	14332	72	213	256	\N	29	15	100	1.374773e+06	2.655082e+06	2.655182e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 23:17:26.752335	\N	\N	f
3988	2026-07-08	14:58:00	14333	72	252	272	\N	29	15	75	7478	2.655182e+06	2.655257e+06	patio	normal	PRUEBA DE RENDIMIENTO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 23:21:49.50858	\N	\N	f
3989	2026-07-08	15:48:00	14334	72	204	246	\N	29	15	70	449711	2.655257e+06	2.655327e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 23:22:25.529449	\N	\N	f
3990	2026-07-08	15:59:00	14335	72	215	258	160	29	15	80	50235	2.655327e+06	2.655407e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 23:22:46.306341	\N	\N	f
3991	2026-07-08	16:16:00	14336	72	206	281	\N	29	15	50	524958	2.655408e+06	2.655458e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-08 23:23:55.616365	\N	\N	f
3992	2026-07-08	16:25:00	14337	72	199	280	\N	29	15	110	144870	2.655458e+06	2.655568e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-09 00:06:54.935712	\N	\N	f
3993	2026-07-08	16:40:00	14338	72	211	254	\N	29	15	100	40370	2.655568e+06	2.655668e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-09 00:07:41.97288	\N	\N	f
3994	2026-07-08	16:49:00	14339	72	227	267	\N	29	15	100	452966	2.655668e+06	2.655768e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-09 00:08:11.309645	\N	\N	f
3995	2026-07-08	17:00:00	14340	72	255	248	\N	29	15	100	3039	2.655768e+06	2.655868e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-09 00:08:47.641234	\N	\N	f
3996	2026-07-08	17:14:00	14341	72	209	251	\N	29	15	100	49604	2.655869e+06	2.655969e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-09 00:09:22.783114	\N	\N	f
3997	2026-07-08	17:25:00	14342	72	228	268	\N	29	15	70	11172	2.655969e+06	2.656039e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-09 00:09:58.681307	\N	\N	f
3998	2026-07-08	17:37:00	14343	72	201	243	\N	29	15	130	20279	2.65604e+06	2.65617e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-09 00:10:33.353721	\N	\N	f
3999	2026-07-09	06:14:00	11747	72	214	257	145	30	16	100	71737	949710	949810	campo	normal	Hora de carga 5.30 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-09 12:16:29.429324	253	257	f
4000	2026-07-09	06:16:00	11748	72	202	244	145	30	16	100	74816	949810	949910	campo	normal	Hora de carga 5.40 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-09 12:18:25.724588	253	244	f
4001	2026-07-08	18:26:00	14344	72	212	255	\N	29	15	70	1725	2.65617e+06	2.65624e+06	patio	normal	Hubodometro dañado 	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-09 17:34:18.429298	\N	\N	f
4002	2026-07-09	07:24:00	14346	72	208	250	\N	29	15	70	1.036947e+06	2.657071e+06	2.657141e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-09 17:35:04.695575	\N	\N	f
4003	2026-07-09	07:40:00	14347	72	232	247	\N	29	15	77	485441	2.657141e+06	2.657218e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-09 17:35:36.914003	\N	\N	f
4004	2026-07-09	13:08:00	15201	72	224	265	156	30	16	50	3909	949910	949960	campo	normal	Hora de carga 9.40 am	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-09 19:11:27.234408	253	265	f
4005	2026-07-09	15:45:00	14348	72	227	267	\N	29	15	100	453159	2.657218e+06	2.657318e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-10 00:35:02.010608	\N	\N	f
4006	2026-07-09	15:55:00	14349	72	211	254	\N	29	15	70	40508	2.657318e+06	2.657388e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-10 00:35:30.609152	\N	\N	f
4007	2026-07-09	16:00:00	14350	72	215	258	\N	29	15	70	50454	2.657388e+06	2.657458e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-10 00:37:19.620683	\N	\N	f
4008	2026-07-09	16:20:00	14551	72	209	251	\N	29	15	80	49820	2.657458e+06	2.657538e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-10 00:37:46.468364	\N	\N	f
4009	2026-07-09	16:27:00	14552	72	226	266	\N	29	15	80	60319	2.657539e+06	2.657619e+06	patio	normal	2 llantas nuevas de la safra de esta semana	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-10 00:38:33.743086	\N	\N	f
4010	2026-07-09	16:37:00	14553	72	199	280	\N	29	15	90	145170	2.657619e+06	2.657709e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-10 00:38:58.815712	\N	\N	f
4011	2026-07-09	16:45:00	14554	72	206	281	\N	29	15	50	525095	2.657709e+06	2.657759e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-10 00:39:29.62462	\N	\N	f
4012	2026-07-09	05:11:00	14555	72	229	269	\N	29	15	100	795975	2.65776e+06	2.65786e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-10 14:09:58.832905	\N	\N	f
4013	2026-07-10	07:30:00	14556	72	252	272	\N	29	15	105	7761	2.65786e+06	2.657965e+06	patio	normal	fin prueba rendmito	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-10 14:10:49.153521	\N	\N	f
4014	2026-07-10	07:40:00	14557	72	208	250	\N	29	15	80	1.037162e+06	2.657965e+06	2.658045e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-10 14:11:13.032988	\N	\N	f
4015	2026-07-10	09:03:00	15202	72	244	253	180	30	16	60	150673	949960	950020	campo	normal	Km 162624 tanque lleno	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 15:06:13.263859	253	253	t
4016	2026-07-10	09:06:00	15203	72	202	244	180	30	16	50	75053	950020	950070	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 15:07:33.291071	253	244	f
4017	2026-07-10	09:07:00	15204	72	198	241	180	30	16	50	85018	950070	950120	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 15:09:14.990107	253	241	f
4018	2026-07-10	09:09:00	15205	72	214	257	180	30	16	50	71988	950120	950170	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 15:10:33.43745	253	257	f
4019	2026-07-10	09:10:00	15206	72	203	242	180	30	16	40	133757	950170	950210	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 15:11:54.308295	253	242	f
4020	2026-07-10	09:11:00	15207	72	197	240	151	30	16	100	29692	950210	950310	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 15:14:05.381909	253	240	f
4021	2026-07-10	09:14:00	15208	72	213	256	143	30	16	100	1.37495e+06	950310	950410	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 15:16:10.728029	253	256	f
4022	2026-07-10	12:09:00	15209	72	228	268	145	30	16	50	11655	950410	950460	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 18:10:56.259969	253	268	f
4023	2026-07-10	12:10:00	15210	72	255	248	146	30	16	50	3302	950460	950510	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 18:12:34.652654	253	248	f
4024	2026-07-10	13:19:00	15211	72	211	254	157	30	16	25	40635	950510	950535	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 19:22:07.323322	253	254	f
4025	2026-07-10	15:09:00	15212	72	201	243	145	30	16	70	21008	950535	950605	campo	normal	\N	user_3D371BhUPGwBX31tK2moNUvyel3	2026-07-10 21:11:00.483466	253	243	f
4026	2026-07-10	17:49:00	14578	72	229	269	\N	29	15	100	796242	2.65983e+06	2.65993e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 00:35:34.187686	\N	\N	f
4028	2026-07-11	00:00:00	14565	74	227	267	\N	29	15	100	453448	2.658977e+06	2.659077e+06	patio	normal	NIVEL BAJO, CARGA POSTFECHADA PARA SABADO. (VIERNES10/07)	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 00:38:43.780382	\N	\N	f
4027	2026-07-10	16:04:00	14564	72	227	267	\N	29	15	1	453448	2.658976e+06	2.658977e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 00:36:47.756571	\N	\N	f
4029	2026-07-10	16:28:00	14566	72	212	255	\N	29	15	49	2245	2.659078e+06	2.659127e+06	patio	normal	SIN HUBODOMETRO, RESULTÓ DAÑADO DIA MIERCOLES POR MAQUINA QUE LE CARGÓ  (SE USO GPS)	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 00:46:10.349334	\N	\N	f
4030	2026-07-11	00:00:00	14567	74	212	255	\N	29	15	100	2245	2.659126e+06	2.659226e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 00:47:17.59985	\N	\N	f
4031	2026-07-10	16:51:00	14568	72	209	251	\N	29	15	1	50031	2.659226e+06	2.659227e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 00:48:05.693733	\N	\N	f
4032	2026-07-11	00:00:00	14569	74	209	251	\N	29	15	110	50031	2.659227e+06	2.659337e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:01:43.748982	\N	\N	f
4033	2026-07-10	11:00:00	14558	72	233	239	\N	29	15	43	1688	2.658045e+06	2.658088e+06	patio	normal	PASO ALAIN POR 2 YOGAS PARA R04	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:03:03.727461	\N	\N	f
4034	2026-07-10	11:20:00	14559	72	204	246	\N	29	15	71	449904	2.658088e+06	2.658159e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:03:50.713776	\N	\N	f
4035	2026-07-10	15:38:00	14560	72	214	257	\N	29	15	1	72171	2.658158e+06	2.658159e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:04:29.903364	\N	\N	f
4036	2026-07-11	00:00:00	14561	74	214	257	\N	29	15	100	72171	2.658159e+06	2.658259e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:05:36.616224	\N	\N	f
4037	2026-07-10	17:02:00	14570	72	226	266	\N	29	15	1	60553	2.659337e+06	2.659338e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:25:32.154111	\N	\N	f
4038	2026-07-11	00:00:00	14571	74	226	266	\N	29	15	120	60553	2.659338e+06	2.659458e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:26:23.595301	\N	\N	f
4039	2026-07-10	17:10:00	14572	72	215	258	\N	29	15	30	50740	2.660647e+06	2.660677e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:27:29.405595	\N	\N	f
4040	2026-07-11	00:00:00	14573	74	215	258	\N	29	15	120	50740	2.659489e+06	2.659609e+06	patio	normal	CARGA POSTFECHADA PARA SABADO, NIVEL MUY BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:28:26.333539	\N	\N	f
4041	2026-07-10	17:25:00	14574	72	206	281	\N	29	15	10	525358	2.659609e+06	2.659619e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:28:58.214247	\N	\N	f
4042	2026-07-11	00:00:00	14575	74	206	281	\N	29	15	100	525358	2.659619e+06	2.659719e+06	patio	normal	CARGA POSTFECHADA SABADO , NIVEL BAJO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:29:31.779137	\N	\N	f
4043	2026-07-10	17:37:00	14576	72	255	248	\N	29	15	1	3465	2.659719e+06	2.65972e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:30:16.469998	\N	\N	f
4044	2026-07-11	00:00:00	14577	74	255	248	\N	29	15	110	3465	2.65972e+06	2.65983e+06	patio	normal	CARGA POSTFECHADA P SABADO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:30:40.627168	\N	\N	f
4045	2026-07-10	18:14:00	14579	72	204	246	\N	29	15	55	450039	2.65993e+06	2.659985e+06	patio	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:55:03.96969	\N	\N	f
4046	2026-07-11	00:00:00	14580	74	204	246	\N	29	15	80	450039	2.659985e+06	2.660065e+06	patio	normal	CARGA POSTFECHADA SABADO	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-11 01:56:37.147279	\N	\N	f
\.


--
-- Data for Name: configuracion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.configuracion (clave, valor, updated_at) FROM stdin;
folio_base_campo	11645	2026-05-22 17:17:57.097
tolerancia_rendimiento	0.0500	2026-05-25 14:29:00.632
alerta_rendimiento_dias	3	2026-05-25 14:29:07.425
folio_base	13951	2026-07-01 23:37:50.485
folio_min_patio	0	2026-07-11 01:24:52.244
folio_max_patio	0	2026-07-11 01:24:52.245
\.


--
-- Data for Name: fuentes_diesel; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.fuentes_diesel (id, nombre, tipo, descripcion, activo) FROM stdin;
29	Taller	taller	Bomba en patio con cuentalitros	t
30	NISSAN	nissan	Camión NISSAN distribución en campo	t
31	Amigo	externo	Préstamo diesel fuente externa (verde)	t
32	OxxoGas	externo	Carga en OxxoGas (rojo)	t
\.


--
-- Data for Name: obras; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.obras (id, nombre, cliente, activo, fecha_inicio, fecha_fin, notas, created_at) FROM stdin;
136	Cerritos	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
137	Capellania	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
138	Valle Real	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
139	Montecarlo	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
140	Colinas del aero	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
141	Cosmopolis	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
142	Cordillera	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
143	Acra	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
144	Santiago	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
145	Incasa	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
146	El Roble	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
147	Hoyo 1	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
148	Pedreras	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
150	Santa Isabel	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
151	Libramiento	\N	t	\N	\N	\N	2026-04-25 00:21:54.773158
152	Novus	\N	t	\N	\N	\N	2026-04-29 22:01:00.235325
153	Riveras del sol	\N	t	\N	\N	\N	2026-04-29 22:01:00.235325
154	MARAVILLAS	CONSORCIO	t	2026-05-04	\N	\N	2026-05-07 20:15:26.852847
155	Cumbres	\N	t	\N	\N	\N	2026-05-08 23:34:04.288209
156	Rio bravo	\N	t	\N	\N	\N	2026-05-13 16:58:07.220391
157	Zaire	\N	t	\N	\N	\N	2026-05-14 19:42:52.912281
158	Domicilio	\N	t	\N	\N	\N	2026-05-15 11:22:25.532431
159	OXXO GAS SAN BLAS- CARGA CON TARJETA	\N	t	\N	\N	\N	2026-05-15 21:27:07.378601
160	Taller	\N	t	\N	\N	\N	2026-05-16 14:06:08.108661
161	Meret	\N	t	\N	\N	\N	2026-05-16 14:09:22.394868
162	NOTA PARA CORTE	\N	t	\N	\N	\N	2026-05-16 15:26:01.297076
163	Domicilio del operador	\N	t	\N	\N	\N	2026-05-18 16:47:42.210471
164	Camino real	\N	t	\N	\N	\N	2026-05-20 22:18:24.65608
165	Canchas	\N	t	\N	\N	\N	2026-05-20 22:30:14.293652
166	Condesa	\N	t	\N	\N	\N	2026-05-23 19:14:00.505318
167	Central avastesimiento	\N	t	\N	\N	\N	2026-05-29 22:56:34.485475
168	Valle del roble	\N	t	\N	\N	\N	2026-06-01 23:13:37.605881
169	Minorte	\N	t	\N	\N	\N	2026-06-02 20:34:46.702699
170	Ave felix u	\N	t	\N	\N	\N	2026-06-05 23:53:04.944635
171	Las vias y panteones	\N	t	\N	\N	\N	2026-06-13 23:03:47.795713
172	Alterra	\N	t	\N	\N	\N	2026-06-19 00:22:23.922707
173	Soli taller climas	\N	t	\N	\N	\N	2026-06-22 20:23:32.190064
174	Los tubos	\N	t	\N	\N	\N	2026-06-25 12:14:10.655292
175	Secundaria jh	\N	t	\N	\N	\N	2026-06-26 20:41:55.883923
176	Almaguer guadaluoe	\N	t	\N	\N	\N	2026-06-30 18:59:48.431555
177	Botanica	\N	t	\N	\N	\N	2026-07-03 22:59:56.915712
178	Santa elena	\N	t	\N	\N	\N	2026-07-04 16:29:25.044662
179	Plaza los puertos	\N	t	\N	\N	\N	2026-07-07 15:20:35.297402
180	Ral del valle	\N	t	\N	\N	\N	2026-07-10 15:04:32.924292
\.


--
-- Data for Name: operadores; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.operadores (id, nombre, tipo, telefono, activo, created_at) FROM stdin;
239	Taller	chofer	\N	t	2026-04-25 00:21:54.759065
240	Tomas	chofer	\N	t	2026-04-25 00:21:54.759065
241	Belmares	chofer	\N	t	2026-04-25 00:21:54.759065
242	Jesus Arroyo	chofer	\N	t	2026-04-25 00:21:54.759065
243	Cesar Castillo	chofer	\N	t	2026-04-25 00:21:54.759065
244	Victor Duran	chofer	\N	t	2026-04-25 00:21:54.759065
246	Enrique Mena	chofer	\N	t	2026-04-25 00:21:54.759065
247	Estrada	chofer	\N	t	2026-04-25 00:21:54.759065
248	Carlos Maldonado	chofer	\N	t	2026-04-25 00:21:54.759065
251	Julio	chofer	\N	t	2026-04-25 00:21:54.759065
252	Maldonado	chofer	\N	t	2026-04-25 00:21:54.759065
253	MAGO	chofer	\N	t	2026-04-25 00:21:54.759065
254	Eric	chofer	\N	t	2026-04-25 00:21:54.759065
255	Francisco	chofer	\N	t	2026-04-25 00:21:54.759065
256	Juan Olguin	chofer	\N	t	2026-04-25 00:21:54.759065
257	Luis G	chofer	\N	t	2026-04-25 00:21:54.759065
258	Victor Marcial	chofer	\N	t	2026-04-25 00:21:54.759065
259	Gustavo	chofer	\N	t	2026-04-25 00:21:54.759065
260	Arq Cuellar	chofer	\N	t	2026-04-25 00:21:54.759065
262	Javier	chofer	\N	t	2026-04-25 00:21:54.759065
266	Christopher	chofer	\N	t	2026-04-25 00:21:54.759065
267	Bernabe	chofer	\N	t	2026-04-25 00:21:54.759065
268	Ivan Niño	chofer	\N	t	2026-04-25 00:21:54.759065
269	Luis Medina	chofer	\N	t	2026-04-25 00:21:54.759065
272	Benito arroyo	chofer	\N	t	2026-04-25 00:21:54.759065
273	Fancisco	chofer	\N	t	2026-04-25 00:21:54.759065
274	Manuel	chofer	\N	t	2026-04-25 00:21:54.759065
276	Angel	chofer	\N	t	2026-04-29 14:59:38.98286
271	Carlos Marcial	maquinista	\N	t	2026-04-25 00:21:54.759065
263	Otoniel	maquinista	\N	t	2026-04-25 00:21:54.759065
270	Rodrigo	maquinista	\N	t	2026-04-25 00:21:54.759065
265	Tobias	maquinista	\N	t	2026-04-25 00:21:54.759065
264	Yoshua	maquinista	\N	t	2026-04-25 00:21:54.759065
249	Antonio Torres	chofer	\N	f	2026-04-25 00:21:54.759065
278	Luis Flaco	maquinista	\N	t	2026-05-08 18:57:07.133239
277	Arq Cordero	chofer	\N	t	2026-04-29 20:34:30.125641
279	Brayan	chofer	\N	t	2026-06-08 23:12:10.271804
280	Laines	chofer	\N	t	2026-06-09 23:01:40.194389
250	Jose Ines Arroyo	chofer	\N	t	2026-04-25 00:21:54.759065
281	Raul Govea	chofer	8116127570	t	2026-07-07 00:08:44.754214
\.


--
-- Data for Name: pb_mensajes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pb_mensajes (id, ticket_id, contenido, autor_id, autor_nombre, autor_rol, leido, created_at) FROM stdin;
\.


--
-- Data for Name: pb_modulos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pb_modulos (id, titulo, resumen, descripcion, categoria, estado, costo_estimado, dias_estimados, progreso, fase, tema, fase_package, impacto, casos_uso, beneficios, dependencias, notas_tecnicas, aprobado_at, aprobado_por, iniciado_at, completado_at, orden, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pb_novedades; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pb_novedades (id, titulo, contenido, tipo, modulo_id, leido, created_at) FROM stdin;
\.


--
-- Data for Name: pb_tickets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pb_tickets (id, titulo, descripcion, tipo, estado, prioridad, modulo_id, creado_por_id, creado_por_nombre, resuelta_at, created_at, updated_at) FROM stdin;
1	STOCK TANQUES 0	Buenas tardes\npor error borré en Configuracion - Ajustar stock de tanques, puse todo a 0,  segun yo estaba probando el funcionamiento del control de folios en las casillas y sin querer utilicé el de ajustar stock, la pregunta es si existe un registro de que nivel tenia el tanque de taller antes de yo poner todo a 0, por que nos queda poco y para tener mas detalle porfa,  mas o menos recuerdo que tenia algo asi como 3,675 apox\ngracias.	question	open	urgent	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Taller WB	\N	2026-07-11 01:15:02.378888	2026-07-11 01:15:02.378888
\.


--
-- Data for Name: periodos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.periodos (id, nombre, fecha_inicio, fecha_fin, cerrado, cerrado_por_id, cerrado_at, created_at) FROM stdin;
62	28 de marzo al 3 de abril de 2026	2026-03-28	2026-04-03	f	\N	\N	2026-05-02 00:49:36.136234
61	25 de abril al 1 de mayo de 2026	2026-04-25	2026-05-01	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:44:47.256	2026-05-02 00:49:36.109522
60	2 de mayo al 8 de mayo de 2026	2026-05-02	2026-05-08	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-09 16:40:04.022	2026-05-02 00:48:07.49846
63	9 de mayo al 15 de mayo de 2026	2026-05-09	2026-05-15	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-16 16:55:05.185	2026-05-09 01:02:25.818485
64	16 de mayo al 22 de mayo de 2026	2026-05-16	2026-05-22	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-23 17:39:35.72	2026-05-16 00:16:18.98302
65	23 de mayo al 29 de mayo de 2026	2026-05-23	2026-05-29	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:58:38.553	2026-05-23 15:32:10.118799
66	30 de mayo al 5 de junio de 2026	2026-05-30	2026-06-05	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-06 17:52:03.618	2026-05-30 01:19:22.141683
67	6 de junio al 12 de junio de 2026	2026-06-06	2026-06-12	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-13 17:18:44.67	2026-06-05 23:59:19.359751
68	13 de junio al 19 de junio de 2026	2026-06-13	2026-06-19	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-20 17:24:15.18	2026-06-13 00:10:11.906579
70	13 de junio al 19 de junio de 2026	2026-06-13	2026-06-19	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 17:45:25.6	2026-06-20 17:54:12.244122
69	20 de junio al 26 de junio de 2026	2026-06-20	2026-06-26	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-06-27 17:45:35.499	2026-06-20 00:04:31.196753
72	4 de julio al 10 de julio de 2026	2026-07-04	2026-07-10	f	\N	\N	2026-07-04 00:57:43.762721
73	25 de julio al 31 de julio de 2026	2026-07-25	2026-07-31	f	\N	\N	2026-07-04 16:45:13.141618
71	27 de junio al 3 de julio de 2026	2026-06-27	2026-07-03	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-07-04 18:15:44.311	2026-06-27 00:19:32.142748
74	11 de julio al 17 de julio de 2026	2026-07-11	2026-07-17	f	\N	\N	2026-07-11 00:33:06.30846
\.


--
-- Data for Name: recargas_tanque; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recargas_tanque (id, fecha, litros, proveedor, folio_factura, precio_litro, tanque_id, registrado_por_id, notas, created_at, cuentalitros_inicio) FROM stdin;
33	2026-05-02	19807	DOS AGUILAS (PEMEX)	MT41953	26.21	15	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-02 19:05:54.186131	2.543768e+06
34	2026-05-14	19823	2 Aguilas (PEMEX)	MT 42409	26.21	15	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-14 16:39:45.216819	2.563222e+06
35	2026-05-27	20000	\N	\N	\N	15	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-27 17:53:35.008499	2.582804e+06
36	2026-06-08	19997	2 Aguilas (PEMEX)	FACT: MT 43572 19,997 TEMP NATURAL, 19,821 TEMP A 20°	26.2	15	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-06-08 19:42:41.498461	2.603771e+06
37	2026-06-19	19999	2 Aguilas (PEMEX)	fact: mt44209	\N	15	user_3BYiAC79vdFAXS59rbNLZhHcBlT	DENSIMETRO POR DEBAJO DE LOS .800 (MARCA APROX .780)	2026-06-19 14:37:59.201516	2.623552e+06
38	2026-07-01	20000	2 Aguilas (PEMEX)	Factura: MT44545	26.12	15	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-07-01 21:39:36.126634	2.643067e+06
\.


--
-- Data for Name: rendimientos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rendimientos (id, periodo_id, unidad_id, operador_id, odometro_inicial, odometro_final, km_hrs_recorridos, litros_consumidos, rendimiento_actual, rendimiento_referencia, diferencia, dentro_tolerancia, notas, created_at) FROM stdin;
269	61	222	\N	291	291	\N	60	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
270	61	221	\N	\N	\N	\N	38	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
271	61	220	\N	\N	\N	\N	123	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
272	61	219	\N	\N	\N	\N	20	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
273	61	238	\N	5627	5627	\N	44	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
274	61	236	\N	1351	1351	\N	29	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
275	61	225	\N	2560	2582	22	681	30.954546	\N	\N	\N	\N	2026-05-02 03:44:47.177985
276	61	234	\N	3612	3612	\N	310	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
277	61	224	\N	3767	3767	\N	91	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
278	61	230	\N	4136	4136	\N	331	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
279	61	218	\N	1428	1428	\N	36	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
280	61	213	\N	1.364622e+06	1.365264e+06	642	401	1.6009974	\N	\N	\N	\N	2026-05-02 03:44:47.177985
281	61	205	\N	14721	15512	791	326	2.4263804	2.7	-0.27361962	f	\N	2026-05-02 03:44:47.177985
282	61	197	\N	11548	20279	8731	401	21.773067	2.61	19.163067	f	\N	2026-05-02 03:44:47.177985
283	61	199	\N	131855	132695	840	536	1.5671642	3.19	-1.6228359	f	\N	2026-05-02 03:44:47.177985
284	61	203	\N	121957	122502	545	377	1.4456234	2.95	-1.5043766	f	\N	2026-05-02 03:44:47.177985
285	61	198	\N	75341	75930	589	350	1.6828572	3.21	-1.5271429	f	\N	2026-05-02 03:44:47.177985
286	61	214	\N	60003	60467	464	300	1.5466666	3.26	-1.7133334	f	\N	2026-05-02 03:44:47.177985
287	61	204	\N	438284	438951	667	460	1.45	2.41	-0.96	f	\N	2026-05-02 03:44:47.177985
288	61	229	\N	784420	785007	587	350	1.6771429	2.26	-0.58285713	f	\N	2026-05-02 03:44:47.177985
289	61	228	\N	1188	2060	872	360	2.4222221	3	-0.5777778	f	\N	2026-05-02 03:44:47.177985
290	61	200	\N	637837	639474	1637	475	3.4463158	\N	\N	\N	\N	2026-05-02 03:44:47.177985
291	61	202	\N	61595	62807	1212	455	2.6637363	2.32	0.34373626	f	\N	2026-05-02 03:44:47.177985
292	61	201	\N	10143	11003	860	380	2.2631578	2.56	-0.2968421	f	\N	2026-05-02 03:44:47.177985
293	61	208	\N	1.028103e+06	1.0286e+06	497	350	1.42	2.47	-1.05	f	\N	2026-05-02 03:44:47.177985
294	61	206	\N	511118	512089	971	425	2.2847059	2.8	-0.51529413	f	\N	2026-05-02 03:44:47.177985
295	61	209	\N	37670	38403	733	391	1.8746803	2.46	-0.5853197	f	\N	2026-05-02 03:44:47.177985
296	61	211	\N	29908	30768	860	421	2.0427554	2.17	-0.12724465	f	\N	2026-05-02 03:44:47.177985
297	61	212	\N	41694	42393	699	355	1.969014	2.97	-1.0009859	f	\N	2026-05-02 03:44:47.177985
298	61	232	\N	474193	474812	619	269	2.3011153	3.78	-1.4788848	f	\N	2026-05-02 03:44:47.177985
299	61	207	\N	482376	483351	975	385	2.5324676	4	-1.4675325	f	\N	2026-05-02 03:44:47.177985
300	61	227	\N	448187	449226	1039	435	2.3885057	2.48	-0.091494255	t	\N	2026-05-02 03:44:47.177985
301	61	215	\N	41519	42083	564	332	1.6987952	2.64	-0.94120485	f	\N	2026-05-02 03:44:47.177985
302	61	237	\N	370854	3.705711e+06	3.334857e+06	231	14436.61	4.8	14431.811	f	\N	2026-05-02 03:44:47.177985
303	61	216	\N	5187	5187	\N	91	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
304	61	235	\N	\N	\N	\N	27	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
305	61	239	\N	\N	\N	\N	70	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
306	61	233	\N	\N	\N	\N	109	\N	\N	\N	\N	\N	2026-05-02 03:44:47.177985
307	60	211	\N	30768	31732	964	531	1.8154426	2.17	-0.35455742	f	\N	2026-05-09 16:40:04.015043
309	60	209	\N	38463	39518	1055	501	2.1057885	2.46	-0.35421157	f	\N	2026-05-09 16:40:04.015043
310	60	201	\N	11046	12369	1323	541	2.4454713	2.56	-0.11452865	t	\N	2026-05-09 16:40:04.015043
311	60	228	\N	2148	2655	507	350	1.4485714	3	-1.5514286	f	\N	2026-05-09 16:40:04.015043
312	60	199	\N	132695	133952	1257	363	3.4628098	3.19	0.27280992	f	\N	2026-05-09 16:40:04.015043
313	60	203	\N	122878	123785	907	382	2.3743455	2.95	-0.57565445	f	\N	2026-05-09 16:40:04.015043
314	60	200	\N	639474	641093	1619	400	4.0475	\N	\N	\N	\N	2026-05-09 16:40:04.015043
315	60	202	\N	62894	63804	910	409.5	2.2222223	2.32	-0.09777778	t	\N	2026-05-09 16:40:04.015043
316	60	226	\N	47909	49017	1108	593	1.8684654	2.84	-0.97153455	f	\N	2026-05-09 16:40:04.015043
317	60	227	\N	449288	450306	1018	441	2.3083901	2.48	-0.17160998	f	\N	2026-05-09 16:40:04.015043
318	60	212	\N	42468	43340	872	450	1.9377778	2.97	-1.0322223	f	\N	2026-05-09 16:40:04.015043
319	60	213	\N	1.365342e+06	1.365976e+06	634	406.5	1.5596555	\N	\N	\N	\N	2026-05-09 16:40:04.015043
320	60	214	\N	61070	62144	1074	501	2.1437125	3.26	-1.1162875	f	\N	2026-05-09 16:40:04.015043
321	60	206	\N	512089	513565	1476	561	2.631016	2.8	-0.16898395	f	\N	2026-05-09 16:40:04.015043
322	60	229	\N	785164	786175	1011	525	1.9257143	2.26	-0.3342857	f	\N	2026-05-09 16:40:04.015043
323	60	198	\N	76298	77080	782	401	1.9501247	3.21	-1.2598753	f	\N	2026-05-09 16:40:04.015043
324	60	205	\N	15598	16426	828	361	2.2936287	2.7	-0.40637118	f	\N	2026-05-09 16:40:04.015043
325	60	237	\N	371209	371546	337	175	1.9257143	4.8	-2.8742857	f	\N	2026-05-09 16:40:04.015043
326	60	234	\N	3612	3650.3	38.3	550	14.360313	\N	\N	\N	\N	2026-05-09 16:40:04.015043
327	60	230	\N	4154	4179	25	475	19	\N	\N	\N	\N	2026-05-09 16:40:04.015043
328	60	225	\N	2598	2607.7	9.7	473	48.762886	\N	\N	\N	\N	2026-05-09 16:40:04.015043
329	60	204	\N	439266	440032	766	450	1.7022222	2.41	-0.7077778	f	\N	2026-05-09 16:40:04.015043
330	60	221	\N	\N	\N	\N	44	\N	\N	\N	\N	\N	2026-05-09 16:40:04.015043
331	60	216	\N	5202	5219	17	133	7.8235292	\N	\N	\N	\N	2026-05-09 16:40:04.015043
332	60	215	\N	42556	43338	782	412	1.8980583	2.64	-0.74194175	f	\N	2026-05-09 16:40:04.015043
333	60	232	\N	475316	475991	675	301	2.2425249	3.78	-1.5374751	f	\N	2026-05-09 16:40:04.015043
334	60	207	\N	483421	483974	553	240	2.3041666	4	-1.6958333	f	\N	2026-05-09 16:40:04.015043
335	60	240	\N	\N	\N	\N	149	\N	\N	\N	\N	\N	2026-05-09 16:40:04.015043
336	60	218	\N	1435	1435	\N	15	\N	\N	\N	\N	\N	2026-05-09 16:40:04.015043
337	60	233	\N	1370	1374.3	4.3	101	23.488373	\N	\N	\N	\N	2026-05-09 16:40:04.015043
338	60	220	\N	19051	19051	\N	78	\N	\N	\N	\N	\N	2026-05-09 16:40:04.015043
339	60	242	\N	44614	44614	\N	130	\N	2.3	\N	\N	\N	2026-05-09 16:40:04.015043
340	60	197	\N	11869	21911	10042	450	22.315556	2.61	19.705555	f	\N	2026-05-15 17:07:41.177048
341	63	230	\N	4194	4237	43	979	22.767443	\N	\N	\N	\N	2026-05-16 16:55:05.174209
342	63	244	\N	150391	150391	\N	84	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
343	63	198	\N	77080	77845	765	400	1.9125	3.21	-1.2975	f	\N	2026-05-16 16:55:05.174209
344	63	201	\N	12369	13456	1087	471	2.3078556	2.56	-0.25214437	f	\N	2026-05-16 16:55:05.174209
345	63	203	\N	124146	125344	1198	352	3.403409	2.95	0.4534091	f	\N	2026-05-16 16:55:05.174209
346	63	213	\N	1.366059e+06	1.367214e+06	1155	471	2.4522293	\N	\N	\N	\N	2026-05-16 16:55:05.174209
347	63	221	\N	6885	6885	\N	82	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
348	63	207	\N	483985	484395	410	185	2.2162163	4	-1.7837838	f	\N	2026-05-16 16:55:05.174209
349	63	226	\N	49159	50473	1314	501	2.6227546	2.84	-0.2172455	f	\N	2026-05-16 16:55:05.174209
350	63	214	\N	62394	63405	1011	500	2.022	3.26	-1.238	f	\N	2026-05-16 16:55:05.174209
351	63	202	\N	64056	65052	996	500	1.992	2.32	-0.328	f	\N	2026-05-16 16:55:05.174209
352	63	200	\N	641093	642720	1627	417	3.9016786	\N	\N	\N	\N	2026-05-16 16:55:05.174209
353	63	206	\N	513751	514920	1169	522	2.2394636	2.8	-0.5605364	f	\N	2026-05-16 16:55:05.174209
354	63	232	\N	476127	476969	842	400	2.105	3.78	-1.675	f	\N	2026-05-16 16:55:05.174209
355	63	215	\N	43338	44888	1550	482	3.2157676	2.64	0.57576764	f	\N	2026-05-16 16:55:05.174209
356	63	211	\N	31890	32652	762	425	1.7929412	2.17	-0.37705883	f	\N	2026-05-16 16:55:05.174209
357	63	229	\N	786175	787354	1179	450	2.62	2.26	0.36	f	\N	2026-05-16 16:55:05.174209
358	63	212	\N	43529	44583	1054	551	1.9128857	2.97	-1.0571144	f	\N	2026-05-16 16:55:05.174209
360	63	225	\N	2632	2632	\N	471	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
361	63	227	\N	450478	451771	1293	578.5	2.2350907	2.48	-0.24490924	f	\N	2026-05-16 16:55:05.174209
362	63	209	\N	39638	40213	575	320	1.796875	2.46	-0.663125	f	\N	2026-05-16 16:55:05.174209
363	63	205	\N	16569	17512	943	410	2.3	2.7	-0.4	f	\N	2026-05-16 16:55:05.174209
364	63	199	\N	134178	135045	867	381	2.2755907	3.19	-0.91440946	f	\N	2026-05-16 16:55:05.174209
365	63	242	\N	44723	45246	523	400	1.3075	2.3	-0.9925	f	\N	2026-05-16 16:55:05.174209
366	63	204	\N	440360	441246	886	510	1.7372549	2.41	-0.6727451	f	\N	2026-05-16 16:55:05.174209
367	63	216	\N	5222	5245	23	154	6.695652	\N	\N	\N	\N	2026-05-16 16:55:05.174209
368	63	219	\N	2745	2745	\N	24	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
369	63	218	\N	1437	1437	\N	20	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
370	63	237	\N	371836	371836	\N	50	\N	4.8	\N	\N	\N	2026-05-16 16:55:05.174209
371	63	245	\N	560482	560902	420	149	2.8187919	5.03	-2.211208	f	\N	2026-05-16 16:55:05.174209
372	63	224	\N	3767	3767	\N	168	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
373	63	233	\N	1401	1401	\N	80	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
374	63	197	\N	22020	23161	1141	501	2.277445	2.61	-0.33255488	f	\N	2026-05-16 16:55:05.174209
375	63	236	\N	1353	1353	\N	8	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
376	63	238	\N	5658	5658	\N	77	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
377	63	220	\N	19051	19051	\N	90	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
378	63	208	\N	1.029153e+06	1.029343e+06	190	212	0.8962264	2.47	-1.5737736	f	\N	2026-05-16 16:55:05.174209
379	63	247	\N	\N	\N	\N	50	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
380	63	240	\N	11212	11212	\N	56	\N	\N	\N	\N	\N	2026-05-16 16:55:05.174209
382	63	234	\N	3664	3686.6	22.6	238	10.530973	\N	\N	\N	\N	2026-05-22 12:04:57.674095
383	64	242	\N	45246	45717	471	495	0.95151514	2.3	-1.3484849	f	\N	2026-05-23 17:39:35.603003
384	64	211	\N	32652	33647	995	510	1.9509804	2.17	-0.2190196	f	\N	2026-05-23 17:39:35.603003
385	64	206	\N	514920	515857	937	450	2.0822222	2.8	-0.7177778	f	\N	2026-05-23 17:39:35.603003
386	64	229	\N	787354	788615	1261	793	1.590164	2.26	-0.66983604	f	\N	2026-05-23 17:39:35.603003
387	64	209	\N	40213	41431	1218	465	2.6193547	2.46	0.15935484	f	\N	2026-05-23 17:39:35.603003
388	64	197	\N	23161	23180	19	100	0.19	2.61	-2.42	f	\N	2026-05-23 17:39:35.603003
389	64	198	\N	77845	78922	1077	349	3.08596	3.21	-0.12404011	f	\N	2026-05-23 17:39:35.603003
390	64	248	\N	562806	562829	23	70	0.32857144	\N	\N	\N	\N	2026-05-23 17:39:35.603003
391	64	201	\N	13456	14255	799	321	2.4890966	2.56	-0.07090343	t	\N	2026-05-23 17:39:35.603003
392	64	208	\N	1.029343e+06	1.030188e+06	845	351	2.4074075	2.47	-0.062592596	t	\N	2026-05-23 17:39:35.603003
393	64	213	\N	1.367214e+06	1.368065e+06	851	370	2.3	\N	\N	\N	\N	2026-05-23 17:39:35.603003
394	64	203	\N	125344	126502	1158	321	3.6074767	2.95	0.65747666	f	\N	2026-05-23 17:39:35.603003
395	64	204	\N	441246	441420	174	90	1.9333333	2.41	-0.47666666	f	\N	2026-05-23 17:39:35.603003
396	64	214	\N	63405	64450	1045	400	2.6125	3.26	-0.6475	f	\N	2026-05-23 17:39:35.603003
397	64	244	\N	150391	150391	\N	59	\N	\N	\N	\N	\N	2026-05-23 17:39:35.603003
398	64	207	\N	484395	485591	1196	401	2.9825437	4	-1.0174564	f	\N	2026-05-23 17:39:35.603003
399	64	224	\N	3767	3848	81	220	2.7160494	\N	\N	\N	\N	2026-05-23 17:39:35.603003
400	64	215	\N	44888	45812	924	350	2.64	2.64	0	t	\N	2026-05-23 17:39:35.603003
401	64	202	\N	65052	66551	1499	450	3.3311112	2.32	1.0111111	f	\N	2026-05-23 17:39:35.603003
402	64	237	\N	371836	372171	335	100	3.35	4.8	-1.45	f	\N	2026-05-23 17:39:35.603003
403	64	245	\N	560902	560986	84	50	1.68	5.03	-3.35	f	\N	2026-05-23 17:39:35.603003
404	64	226	\N	50473	51672	1199	450	2.6644444	2.84	-0.17555556	f	\N	2026-05-23 17:39:35.603003
405	64	212	\N	44583	45686	1103	420	2.6261904	2.97	-0.34380952	f	\N	2026-05-23 17:39:35.603003
406	64	205	\N	17512	18339	827	320	2.584375	2.7	-0.115625	f	\N	2026-05-23 17:39:35.603003
407	64	199	\N	135045	136157	1112	321	3.4641745	3.19	0.27417445	f	\N	2026-05-23 17:39:35.603003
408	64	240	\N	11212	11223.9	11.9	110	9.243697	\N	\N	\N	\N	2026-05-23 17:39:35.603003
409	64	225	\N	2632	2675.7	43.7	283	6.4759727	\N	\N	\N	\N	2026-05-23 17:39:35.603003
410	64	233	\N	1401	1457	56	160	2.857143	\N	\N	\N	\N	2026-05-23 17:39:35.603003
411	64	239	\N	\N	\N	\N	20	\N	\N	\N	\N	\N	2026-05-23 17:39:35.603003
412	64	230	\N	4237	4277	40	602	15.05	\N	\N	\N	\N	2026-05-23 17:39:35.603003
413	64	216	\N	5245	5268	23	123	5.347826	\N	\N	\N	\N	2026-05-23 17:39:35.603003
414	64	219	\N	2745	2753	8	60	7.5	\N	\N	\N	\N	2026-05-23 17:39:35.603003
415	64	232	\N	476969	477808	839	250	3.356	3.78	-0.424	f	\N	2026-05-23 17:39:35.603003
416	64	227	\N	451771	452230	459	200	2.295	2.48	-0.185	f	\N	2026-05-23 17:39:35.603003
417	64	220	\N	19051	19051	\N	117	\N	\N	\N	\N	\N	2026-05-23 17:39:35.603003
418	64	221	\N	6885	6902	17	80	4.7058825	\N	\N	\N	\N	2026-05-23 17:39:35.603003
419	65	212	\N	45686	46588	902	472	1.911017	2.97	-1.0589831	f	\N	2026-05-30 03:58:38.542473
420	65	209	\N	41431	42813	1382	566	2.4416962	2.46	-0.018303886	t	\N	2026-05-30 03:58:38.542473
421	65	207	\N	485591	485591	\N	100	\N	4	\N	\N	\N	2026-05-30 03:58:38.542473
422	65	211	\N	33647	34498	851	451	1.886918	2.17	-0.28308204	f	\N	2026-05-30 03:58:38.542473
423	65	205	\N	18339	19279	940	510	1.8431373	2.7	-0.8568627	f	\N	2026-05-30 03:58:38.542473
424	65	206	\N	515857	517510	1653	530	3.1188679	2.8	0.31886792	f	\N	2026-05-30 03:58:38.542473
425	65	228	\N	2655	4225	1570	552	2.844203	3	-0.1557971	f	\N	2026-05-30 03:58:38.542473
426	65	201	\N	14255	15143	888	480	1.85	2.56	-0.71	f	\N	2026-05-30 03:58:38.542473
427	65	242	\N	45717	46117	400	541	0.73937154	2.3	-1.5606284	f	\N	2026-05-30 03:58:38.542473
428	65	199	\N	136157	137212	1055	421	2.5059383	3.19	-0.68406177	f	\N	2026-05-30 03:58:38.542473
429	65	208	\N	1.030188e+06	1.031193e+06	1005	482	2.0850623	2.47	-0.38493776	f	\N	2026-05-30 03:58:38.542473
430	65	202	\N	66551	67958	1407	550	2.5581818	2.32	0.23818181	f	\N	2026-05-30 03:58:38.542473
431	65	198	\N	78922	79879	957	321	2.9813085	3.21	-0.2286916	f	\N	2026-05-30 03:58:38.542473
432	65	215	\N	45812	47080	1268	470	2.6978724	2.64	0.05787234	t	\N	2026-05-30 03:58:38.542473
433	65	227	\N	452230	452389	159	100	1.59	2.48	-0.89	f	\N	2026-05-30 03:58:38.542473
434	65	203	\N	126502	127566	1064	451	2.3592017	2.95	-0.5907982	f	\N	2026-05-30 03:58:38.542473
435	65	226	\N	51672	53058	1386	520	2.6653845	2.84	-0.17461538	f	\N	2026-05-30 03:58:38.542473
436	65	214	\N	64450	65681	1231	421	2.9239905	3.26	-0.3360095	f	\N	2026-05-30 03:58:38.542473
437	65	213	\N	1.368065e+06	1.3691e+06	1035	465	2.2258065	\N	\N	\N	\N	2026-05-30 03:58:38.542473
438	65	230	\N	4277	4318	41	600	14.634147	\N	\N	\N	\N	2026-05-30 03:58:38.542473
439	65	232	\N	477808	478844	1036	321	3.2274144	3.78	-0.55258566	f	\N	2026-05-30 03:58:38.542473
440	65	204	\N	441420	442433	1013	420	2.4119048	2.41	0.0019047619	t	\N	2026-05-30 03:58:38.542473
441	65	234	\N	3686.6	3689.4	2.8	100	35.714287	\N	\N	\N	\N	2026-05-30 03:58:38.542473
442	65	216	\N	5268	5286	18	110	6.111111	\N	\N	\N	\N	2026-05-30 03:58:38.542473
443	65	219	\N	2753	2769	16	39	2.4375	\N	\N	\N	\N	2026-05-30 03:58:38.542473
444	65	249	\N	\N	\N	\N	28	\N	\N	\N	\N	\N	2026-05-30 03:58:38.542473
445	65	233	\N	1457	1512	55	120	2.1818182	\N	\N	\N	\N	2026-05-30 03:58:38.542473
446	65	229	\N	788615	789547	932	250	3.728	2.26	1.468	f	\N	2026-05-30 03:58:38.542473
447	65	196	\N	11247.9	11247.9	\N	20	\N	\N	\N	\N	\N	2026-05-30 03:58:38.542473
448	65	248	\N	562829	562888	59	30	1.9666667	\N	\N	\N	\N	2026-05-30 03:58:38.542473
449	65	245	\N	560986	561895	909	130	6.9923077	5.03	1.9623077	f	\N	2026-05-30 03:58:38.542473
450	65	250	\N	\N	\N	\N	160	\N	\N	\N	\N	\N	2026-05-30 03:58:38.542473
451	65	221	\N	6902	6902	\N	91	\N	\N	\N	\N	\N	2026-05-30 03:58:38.542473
452	65	220	\N	19051	19051	\N	43	\N	\N	\N	\N	\N	2026-05-30 03:58:38.542473
453	65	236	\N	1353	1354	1	26	26	\N	\N	\N	\N	2026-05-30 03:58:38.542473
454	65	240	\N	11223.9	11259	35.1	120	3.4188035	\N	\N	\N	\N	2026-05-30 03:58:38.542473
455	65	241	\N	\N	\N	\N	70	\N	\N	\N	\N	\N	2026-05-30 03:58:38.542473
456	66	206	\N	517510	518919	1409	551	2.5571687	2.8	-0.24283122	f	\N	2026-06-06 17:52:03.603034
457	66	213	\N	1.3691e+06	1.370077e+06	977	505	1.9346535	\N	\N	\N	\N	2026-06-06 17:52:03.603034
458	66	214	\N	65681	67057	1376	550	2.5018182	3.26	-0.7581818	f	\N	2026-06-06 17:52:03.603034
459	66	242	\N	46117	46118	1	601	0.0016638935	2.3	-2.298336	f	\N	2026-06-06 17:52:03.603034
460	66	211	\N	34498	35522	1024	551	1.8584392	2.17	-0.3115608	f	\N	2026-06-06 17:52:03.603034
461	66	212	\N	46588	48181	1593	640	2.4890625	2.97	-0.4809375	f	\N	2026-06-06 17:52:03.603034
462	66	202	\N	67958	69781	1823	620	2.9403226	2.32	0.6203226	f	\N	2026-06-06 17:52:03.603034
463	66	232	\N	478844	480058	1214	400	3.035	3.78	-0.745	f	\N	2026-06-06 17:52:03.603034
464	66	208	\N	1.031193e+06	1.032201e+06	1008	501	2.011976	2.47	-0.45802397	f	\N	2026-06-06 17:52:03.603034
465	66	198	\N	79879	80855	976	351	2.7806268	3.21	-0.4293732	f	\N	2026-06-06 17:52:03.603034
466	66	230	\N	4318	4373	55	901	16.381819	\N	\N	\N	\N	2026-06-06 17:52:03.603034
467	66	209	\N	42813	44129	1316	546	2.4102564	2.46	-0.04974359	t	\N	2026-06-06 17:52:03.603034
468	66	251	\N	\N	\N	\N	32	\N	\N	\N	\N	\N	2026-06-06 17:52:03.603034
469	66	203	\N	127566	128827	1261	411	3.0681264	2.95	0.11812652	t	\N	2026-06-06 17:52:03.603034
470	66	228	\N	4225	5738	1513	580	2.6086206	3	-0.3913793	f	\N	2026-06-06 17:52:03.603034
471	66	252	\N	471	1639	1168	551	2.1197822	\N	\N	\N	\N	2026-06-06 17:52:03.603034
472	66	244	\N	150391	150391	\N	65	\N	\N	\N	\N	\N	2026-06-06 17:52:03.603034
473	66	204	\N	442433	443941	1508	600	2.5133333	2.41	0.10333333	t	\N	2026-06-06 17:52:03.603034
474	66	226	\N	53058	54435	1377	610	2.2573771	2.84	-0.58262295	f	\N	2026-06-06 17:52:03.603034
475	66	197	\N	23180	24459	1279	421	3.0380046	2.61	0.42800474	f	\N	2026-06-06 17:52:03.603034
476	66	199	\N	137212	138357	1145	360	3.1805556	3.19	-0.009444444	t	\N	2026-06-06 17:52:03.603034
477	66	241	\N	19345	19345	\N	40	\N	\N	\N	\N	\N	2026-06-06 17:52:03.603034
478	66	233	\N	1512	1524	12	94	7.8333335	\N	\N	\N	\N	2026-06-06 17:52:03.603034
479	66	216	\N	5286	5308	22	120	5.4545455	\N	\N	\N	\N	2026-06-06 17:52:03.603034
480	66	234	\N	3689.4	3699.1	9.7	359	37.01031	\N	\N	\N	\N	2026-06-06 17:52:03.603034
481	66	205	\N	19279	20293	1014	370	2.7405405	2.7	0.04054054	t	\N	2026-06-06 17:52:03.603034
482	66	240	\N	11259	11266	7	110	15.714286	\N	\N	\N	\N	2026-06-06 17:52:03.603034
483	66	229	\N	789547	791200	1653	600	2.755	2.26	0.495	f	\N	2026-06-06 17:52:03.603034
484	66	227	\N	452389	452560	171	60	2.85	2.48	0.37	f	\N	2026-06-06 17:52:03.603034
485	66	250	\N	1	1	\N	100	\N	\N	\N	\N	\N	2026-06-06 17:52:03.603034
486	66	253	\N	3629	3629	\N	60	\N	\N	\N	\N	\N	2026-06-06 17:52:03.603034
487	66	254	\N	\N	\N	\N	40	\N	\N	\N	\N	\N	2026-06-06 17:52:03.603034
488	67	213	\N	1.370077e+06	1.370911e+06	834	520	1.6038462	\N	\N	\N	\N	2026-06-13 17:18:44.627868
489	67	211	\N	35522	36608	1086	566	1.9187279	2.17	-0.25127208	f	\N	2026-06-13 17:18:44.627868
490	67	197	\N	24459	25871	1412	611	2.3109655	2.61	-0.29903436	f	\N	2026-06-13 17:18:44.627868
491	67	205	\N	20293	21598	1305	540	2.4166667	2.7	-0.28333333	f	\N	2026-06-13 17:18:44.627868
492	67	226	\N	54435	55599	1164	430	2.7069767	2.84	-0.13302326	t	\N	2026-06-13 17:18:44.627868
493	67	242	\N	46118	46120	2	610	0.0032786885	2.3	-2.2967212	f	\N	2026-06-13 17:18:44.627868
494	67	206	\N	518919	520465	1546	629	2.4578695	2.8	-0.34213036	f	\N	2026-06-13 17:18:44.627868
495	67	199	\N	138357	139489	1132	500	2.264	3.19	-0.926	f	\N	2026-06-13 17:18:44.627868
496	67	202	\N	69781	71475	1694	521	3.2514396	2.32	0.9314395	f	\N	2026-06-13 17:18:44.627868
497	67	198	\N	80855	81893	1038	421	2.4655583	3.21	-0.7444418	f	\N	2026-06-13 17:18:44.627868
498	67	214	\N	67057	67789	732	350	2.0914285	3.26	-1.1685715	f	\N	2026-06-13 17:18:44.627868
499	67	212	\N	48181	49589	1408	551	2.5553539	2.97	-0.4146461	f	\N	2026-06-13 17:18:44.627868
500	67	252	\N	1639	3323	1684	551	3.0562613	\N	\N	\N	\N	2026-06-13 17:18:44.627868
501	67	254	\N	476767	476767	\N	40	\N	\N	\N	\N	\N	2026-06-13 17:18:44.627868
502	67	208	\N	1.032201e+06	1.033179e+06	978	490	1.9959184	2.47	-0.47408164	f	\N	2026-06-13 17:18:44.627868
503	67	203	\N	128827	129896	1069	401	2.6658354	2.95	-0.28416458	f	\N	2026-06-13 17:18:44.627868
504	67	204	\N	443941	445169	1228	490	2.5061224	2.41	0.09612245	t	\N	2026-06-13 17:18:44.627868
505	67	201	\N	15143	16576	1433	470	3.0489361	2.56	0.48893616	f	\N	2026-06-13 17:18:44.627868
506	67	209	\N	44129	45464	1335	601	2.2212977	2.46	-0.23870216	f	\N	2026-06-13 17:18:44.627868
507	67	229	\N	791200	791774	574	298	1.9261745	2.26	-0.3338255	f	\N	2026-06-13 17:18:44.627868
508	67	245	\N	561895	563243	1348	340	3.964706	5.03	-1.0652941	f	\N	2026-06-13 17:18:44.627868
509	67	215	\N	47080	47235	155	60	2.5833333	2.64	-0.05666667	t	\N	2026-06-13 17:18:44.627868
510	67	234	\N	3699.1	3726	26.9	207	7.695167	\N	\N	\N	\N	2026-06-13 17:18:44.627868
511	67	221	\N	6902	6902	\N	80	\N	\N	\N	\N	\N	2026-06-13 17:18:44.627868
512	67	232	\N	480058	481745	1687	502	3.3605578	3.78	-0.41944224	f	\N	2026-06-13 17:18:44.627868
513	67	228	\N	5738	7290	1552	540	2.874074	3	-0.12592593	t	\N	2026-06-13 17:18:44.627868
514	67	244	\N	150391	150673	282	66	0.23404256	\N	\N	\N	\N	2026-06-13 17:18:44.627868
515	67	200	\N	642720	644593	1873	450	4.1622224	\N	\N	\N	\N	2026-06-13 17:18:44.627868
516	67	224	\N	3848	3873	25	300	12	\N	\N	\N	\N	2026-06-13 17:18:44.627868
517	67	241	\N	19345	19345	\N	160	\N	\N	\N	\N	\N	2026-06-13 17:18:44.627868
518	67	248	\N	562888	562926	38	40	0.95	\N	\N	\N	\N	2026-06-13 17:18:44.627868
519	67	216	\N	5308	5319	11	70	6.3636365	\N	\N	\N	\N	2026-06-13 17:18:44.627868
520	67	225	\N	2675.7	2715.3	39.6	305	7.70202	\N	\N	\N	\N	2026-06-13 17:18:44.627868
521	67	219	\N	2769	2769	\N	19	\N	\N	\N	\N	\N	2026-06-13 17:18:44.627868
522	67	247	\N	7868	7868	\N	50	\N	\N	\N	\N	\N	2026-06-13 17:18:44.627868
523	67	250	\N	1	1	\N	100	\N	\N	\N	\N	\N	2026-06-13 17:18:44.627868
525	68	211	\N	36608	37629	1021	551	1.8529946	2.17	-0.31700546	f	\N	2026-06-20 17:24:15.165323
526	68	202	\N	71475	71629	154	200	0.77	2.32	-1.55	f	\N	2026-06-20 17:24:15.165323
527	68	226	\N	55599	56761	1162	491	2.3665988	2.84	-0.47340122	f	\N	2026-06-20 17:24:15.165323
528	68	228	\N	7290	8516	1226	421	2.912114	3	-0.08788598	t	\N	2026-06-20 17:24:15.165323
529	68	198	\N	81893	82709	816	371	2.199461	3.21	-1.010539	f	\N	2026-06-20 17:24:15.165323
530	68	208	\N	1.033179e+06	1.034185e+06	1006	701	1.4350927	2.47	-1.0349072	f	\N	2026-06-20 17:24:15.165323
531	68	232	\N	481745	482882	1137	401	2.8354115	3.78	-0.94458854	f	\N	2026-06-20 17:24:15.165323
532	68	197	\N	25871	27059	1188	543	2.1878452	2.61	-0.4221547	f	\N	2026-06-20 17:24:15.165323
533	68	201	\N	16576	17141	565	320	1.765625	2.56	-0.794375	f	\N	2026-06-20 17:24:15.165323
534	68	216	\N	5319	5343	24	158	6.5833335	\N	\N	\N	\N	2026-06-20 17:24:15.165323
535	68	217	\N	1042.1	1042.1	\N	24	\N	\N	\N	\N	\N	2026-06-20 17:24:15.165323
537	68	205	\N	21598	22635	1037	451	2.2993348	2.7	-0.4006652	f	\N	2026-06-20 17:24:15.165323
538	68	209	\N	45464	46736	1272	600	2.12	2.46	-0.34	f	\N	2026-06-20 17:24:15.165323
539	68	206	\N	520465	521842	1377	571	2.4115586	2.8	-0.38844132	f	\N	2026-06-20 17:24:15.165323
540	68	199	\N	139489	141000	1511	430	3.5139534	3.19	0.32395348	f	\N	2026-06-20 17:24:15.165323
541	68	241	\N	19345	19345	\N	120	\N	\N	\N	\N	\N	2026-06-20 17:24:15.165323
542	68	221	\N	6902	6902	\N	120	\N	\N	\N	\N	\N	2026-06-20 17:24:15.165323
543	68	252	\N	3323	4383	1060	381	2.7821522	\N	\N	\N	\N	2026-06-20 17:24:15.165323
544	68	203	\N	129896	130801	905	261	3.467433	2.95	0.5174329	f	\N	2026-06-20 17:24:15.165323
545	68	200	\N	644593	644798	205	100	2.05	\N	\N	\N	\N	2026-06-20 17:24:15.165323
546	68	213	\N	1.370911e+06	1.372003e+06	1092	501	2.1796408	\N	\N	\N	\N	2026-06-20 17:24:15.165323
547	68	229	\N	791774	793062	1288	550	2.341818	2.26	0.08181818	t	\N	2026-06-20 17:24:15.165323
548	68	204	\N	445169	446559	1390	520	2.6730769	2.41	0.26307693	f	\N	2026-06-20 17:24:15.165323
549	68	245	\N	563243	563778	535	200	2.675	5.03	-2.355	f	\N	2026-06-20 17:24:15.165323
550	68	244	\N	150673	150673	\N	39	\N	\N	\N	\N	\N	2026-06-20 17:24:15.165323
551	68	234	\N	3726	3759.1	33.1	259	7.8247733	\N	\N	\N	\N	2026-06-20 17:24:15.165323
552	68	218	\N	1437	1453.3	16.3	41	2.5153375	\N	\N	\N	\N	2026-06-20 17:24:15.165323
553	68	224	\N	3873	3894	21	100	4.7619047	\N	\N	\N	\N	2026-06-20 17:24:15.165323
554	68	250	\N	1	1	\N	122	\N	\N	\N	\N	\N	2026-06-20 17:24:15.165323
555	68	248	\N	562926	562966	40	100	0.4	\N	\N	\N	\N	2026-06-20 17:24:15.165323
556	68	225	\N	2715.3	2743.5	28.2	271	9.609929	\N	\N	\N	\N	2026-06-20 17:24:15.165323
557	68	207	\N	485591	485761	170	100	1.7	4	-2.3	f	\N	2026-06-20 17:24:15.165323
558	68	214	\N	67789	68710	921	201	4.5820894	3.26	1.3220896	f	\N	2026-06-20 17:24:15.165323
559	68	237	\N	372171	372925	754	130	5.8	4.8	1	f	\N	2026-06-20 17:24:15.165323
562	68	215	\N	47356	47697	341	306	1.114379	2.64	-1.5256209	f	\N	2026-06-20 17:29:30.128187
563	68	242	\N	3537	46120	42583	550	77.42364	2.3	75.123634	f	\N	2026-06-24 00:45:10.497283
564	68	212	\N	49589	50413	824	550	1.4981818	2.97	-1.4718182	f	\N	2026-06-24 00:48:52.702516
565	70	214	\N	67789	68100	311	120	2.5916667	3.26	-0.66833335	f	\N	2026-06-27 17:45:25.591058
566	70	203	\N	129896	\N	\N	120	\N	2.95	\N	\N	\N	2026-06-27 17:45:25.591058
567	69	211	\N	37629	38328	699	460	1.5195652	2.17	-0.6504348	f	\N	2026-06-27 17:45:35.494935
568	69	206	\N	521842	523163	1321	510	2.5901961	2.8	-0.20980392	f	\N	2026-06-27 17:45:35.494935
569	69	202	\N	71629	72829	1200	366	3.2786884	2.32	0.9586885	f	\N	2026-06-27 17:45:35.494935
571	69	215	\N	47697	48432	735	311	2.363344	2.64	-0.27665594	f	\N	2026-06-27 17:45:35.494935
572	69	209	\N	46736	47781	1045	501	2.0858283	2.46	-0.37417164	f	\N	2026-06-27 17:45:35.494935
573	69	203	\N	130801	131617	816	272	3	2.95	0.05	t	\N	2026-06-27 17:45:35.494935
574	69	237	\N	372925	372931	6	64	0.09375	4.8	-4.70625	f	\N	2026-06-27 17:45:35.494935
575	69	213	\N	1.372003e+06	1.372788e+06	785	361	2.1745152	\N	\N	\N	\N	2026-06-27 17:45:35.494935
576	69	228	\N	8516	9033	517	201	2.5721393	3	-0.4278607	f	\N	2026-06-27 17:45:35.494935
577	69	214	\N	68100	69831	1731	361	4.795014	3.26	1.5350138	f	\N	2026-06-27 17:45:35.494935
578	69	204	\N	446559	447623	1064	440	2.418182	2.41	0.008181818	t	\N	2026-06-27 17:45:35.494935
579	69	244	\N	150673	150673	\N	126	\N	\N	\N	\N	\N	2026-06-27 17:45:35.494935
580	69	234	\N	3759.1	3813	53.9	574	10.649351	\N	\N	\N	\N	2026-06-27 17:45:35.494935
581	69	198	\N	82709	83531	822	291	2.8247423	3.21	-0.38525772	f	\N	2026-06-27 17:45:35.494935
582	69	225	\N	2743.5	2771.5	28	295	10.535714	\N	\N	\N	\N	2026-06-27 17:45:35.494935
583	69	212	\N	50413	698	\N	316	\N	2.97	\N	\N	\N	2026-06-27 17:45:35.494935
584	69	199	\N	141000	142388	1388	451	3.0776052	3.19	-0.112394676	t	\N	2026-06-27 17:45:35.494935
585	69	229	\N	793062	794278	1216	530	2.2943397	2.26	0.03433962	t	\N	2026-06-27 17:45:35.494935
586	69	201	\N	17141	18268	1127	430	2.6209302	2.56	0.060930233	t	\N	2026-06-27 17:45:35.494935
587	69	241	\N	19345	19345	\N	102	\N	\N	\N	\N	\N	2026-06-27 17:45:35.494935
588	69	217	\N	1042.1	1042.1	\N	20	\N	\N	\N	\N	\N	2026-06-27 17:45:35.494935
589	69	232	\N	482882	483878	996	300	3.32	3.78	-0.46	f	\N	2026-06-27 17:45:35.494935
590	69	252	\N	4383	5450	1067	360	2.963889	\N	\N	\N	\N	2026-06-27 17:45:35.494935
591	69	216	\N	5343	5377	34	220	6.470588	\N	\N	\N	\N	2026-06-27 17:45:35.494935
592	69	205	\N	22635	23480	845	301	2.807309	2.7	0.10730897	t	\N	2026-06-27 17:45:35.494935
593	69	197	\N	27059	27885	826	351	2.3532763	2.61	-0.25672364	f	\N	2026-06-27 17:45:35.494935
594	69	242	\N	46120	4248	\N	371	\N	2.3	\N	\N	\N	2026-06-27 17:45:35.494935
595	69	208	\N	1.034185e+06	1.035178e+06	993	121	8.206612	2.47	5.7366114	f	\N	2026-06-27 17:45:35.494935
596	69	255	\N	165	650	485	238	2.037815	\N	\N	\N	\N	2026-06-27 17:45:35.494935
597	69	233	\N	1524	1629	105	40	0.3809524	\N	\N	\N	\N	2026-06-27 17:45:35.494935
598	69	253	\N	3629	3661.2	32.2	75	2.3291926	\N	\N	\N	\N	2026-06-27 17:45:35.494935
600	69	226	\N	56766	57930	1164	421	2.7648456	2.84	-0.075154394	t	\N	2026-06-27 17:56:33.18638
601	71	199	\N	142388	144000	1612	550	2.9309092	3.19	-0.2590909	f	\N	2026-07-04 18:15:44.302202
602	71	211	\N	38328	39639	1311	551	2.3793104	2.17	0.20931034	f	\N	2026-07-04 18:15:44.302202
603	71	212	\N	698	1054	356	250	1.424	2.97	-1.546	f	\N	2026-07-04 18:15:44.302202
604	71	242	\N	4248	4420	172	160	1.075	2.3	-1.225	f	\N	2026-07-04 18:15:44.302202
605	71	226	\N	57930	59224	1294	471	2.7473462	2.84	-0.09265393	t	\N	2026-07-04 18:15:44.302202
606	71	232	\N	483878	485040	1162	401	2.8977556	3.78	-0.8822444	f	\N	2026-07-04 18:15:44.302202
607	71	198	\N	83531	84269	738	301	2.4518273	3.21	-0.75817275	f	\N	2026-07-04 18:15:44.302202
608	71	205	\N	23480	24469	989	481	2.056133	2.7	-0.64386696	f	\N	2026-07-04 18:15:44.302202
609	71	197	\N	27885	28620	735	296	2.483108	2.61	-0.1268919	t	\N	2026-07-04 18:15:44.302202
610	71	252	\N	5450	6613	1163	540	2.1537037	\N	\N	\N	\N	2026-07-04 18:15:44.302202
612	71	208	\N	1.035178e+06	1.036269e+06	1091	516	2.114341	2.47	-0.35565892	f	\N	2026-07-04 18:15:44.302202
613	71	201	\N	18268	19693	1425	540	2.6388888	2.56	0.078888886	t	\N	2026-07-04 18:15:44.302202
614	71	215	\N	48432	49436	1004	350	2.8685715	2.64	0.22857143	f	\N	2026-07-04 18:15:44.302202
615	71	214	\N	69831	71047	1216	451	2.6962306	3.26	-0.5637694	f	\N	2026-07-04 18:15:44.302202
616	71	229	\N	794278	795565	1287	540	2.3833334	2.26	0.123333335	f	\N	2026-07-04 18:15:44.302202
617	71	202	\N	72829	74037	1208	491	2.4602852	2.32	0.14028513	f	\N	2026-07-04 18:15:44.302202
618	71	255	\N	650	2229	1579	531	2.9736347	\N	\N	\N	\N	2026-07-04 18:15:44.302202
619	71	206	\N	523163	524396	1233	360	3.425	2.8	0.625	f	\N	2026-07-04 18:15:44.302202
620	71	213	\N	1.372788e+06	1.373956e+06	1168	461	2.5336225	\N	\N	\N	\N	2026-07-04 18:15:44.302202
621	71	228	\N	9033	10399	1366	470	2.906383	3	-0.09361702	t	\N	2026-07-04 18:15:44.302202
622	71	244	\N	150673	150673	\N	120	\N	\N	\N	\N	\N	2026-07-04 18:15:44.302202
623	71	234	\N	3813	3830.1	17.1	272	15.906433	\N	\N	\N	\N	2026-07-04 18:15:44.302202
624	71	209	\N	47781	48655	874	399	2.1904762	2.46	-0.2695238	f	\N	2026-07-04 18:15:44.302202
625	71	204	\N	447623	448983	1360	539	2.5231912	2.41	0.1131911	t	\N	2026-07-04 18:15:44.302202
626	71	216	\N	5377	5407	30	182	6.0666666	\N	\N	\N	\N	2026-07-04 18:15:44.302202
627	71	218	\N	1453.3	1485.3	32	46	1.4375	\N	\N	\N	\N	2026-07-04 18:15:44.302202
628	71	256	\N	7204	7204	\N	130	\N	\N	\N	\N	\N	2026-07-04 18:15:44.302202
629	71	241	\N	19345	19345	\N	60	\N	\N	\N	\N	\N	2026-07-04 18:15:44.302202
630	71	233	\N	1629	1652	23	60	2.6086957	\N	\N	\N	\N	2026-07-04 18:15:44.302202
631	71	245	\N	563778	564281	503	80	6.2875	5.03	1.2575	f	\N	2026-07-04 18:15:44.302202
632	71	217	\N	1042.1	1048.1	6	17	2.8333333	\N	\N	\N	\N	2026-07-04 18:15:44.302202
634	71	203	\N	131661	132880	1219	561	2.1729054	2.95	-0.7770945	f	\N	2026-07-04 20:45:53.815939
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, label, permisos, is_system) FROM stdin;
wendy_vn	Adminnnn	["dashboard","cargas.historial","catalogo","periodos"]	f
despachador	Despachador	["cargas.historial","cargas.nueva_patio"]	t
operador_nissan	Operador NISSAN	["cargas.historial","cargas.nueva_campo"]	t
encargado_obra	Encargado de Obra	["cargas.historial","cargas.nueva_campo","catalogo"]	t
chofer	Chofer	["cargas.historial"]	t
admin	Administrador	["dashboard","settings","cargas.historial","cargas.nueva_patio","cargas.nueva_campo","catalogo","periodos","admin","poxelbit","analiticas"]	t
gerente	Gerente	["dashboard","settings","cargas.historial","cargas.nueva_patio","cargas.nueva_campo","catalogo","periodos","poxelbit","analiticas"]	t
wendy	Administración	["dashboard","catalogo","cargas.nueva_patio","cargas.nueva_campo","cargas.historial","periodos","admin","analiticas"]	f
wendy2	Admin	["dashboard","cargas.nueva_campo","cargas.nueva_patio","catalogo","periodos","cargas.historial","analiticas"]	f
\.


--
-- Data for Name: tanques; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tanques (id, nombre, capacidad_max, litros_actuales, cuentalitros_actual, ajuste_porcentaje, ultima_actualizacion) FROM stdin;
16	NISSAN	1200	1200	950605	2	2026-07-11 01:06:32.005
15	Taller	21001	3138	2.660677e+06	2	2026-07-11 01:56:37.15
\.


--
-- Data for Name: transferencias_tanque; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transferencias_tanque (id, fecha, litros, tanque_origen_id, tanque_destino_id, registrado_por_id, notas, created_at, folio, cuentalitros_nissan_inicio, cuentalitros_destino) FROM stdin;
28	2026-05-02	990	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-02 16:18:30.399248	13490	\N	\N
29	2026-05-04	1149	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-04 23:30:45.150953	13501	\N	\N
30	2026-05-05	1109	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	cuenta litros 908580, folio 13166	2026-05-05 18:55:57.037905	13502	\N	\N
31	2026-05-06	245	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Recarga, solo surtió ex14	2026-05-06 01:28:01.632674	13503	\N	\N
32	2026-05-06	1065	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	full	2026-05-06 23:16:53.732344	13504	\N	\N
51	2026-05-28	1125	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	FOLIO: 13588, REMANENTE 100, CUENTALT. 925653	2026-05-29 14:03:47.013676	131220	2.5881e+06	2.589225e+06
34	2026-05-08	1151	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-08 21:54:05.790231	131201	2.554261e+06	2.555312e+06
36	2026-05-11	1151	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-11 18:38:15.613945	131202	2.557286e+06	2.558437e+06
37	2026-05-12	1137	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	913733 cuenta litros\nFolio Nota fisica 13135	2026-05-12 14:20:06.199907	131203	2.559197e+06	2.560334e+06
38	2026-05-13	615	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Rellenar 	2026-05-13 11:38:44.943725	131204	913837	\N
39	2026-05-13	450	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	se detiene la carga para dejar litros para camiones\nfolio 13351	2026-05-13 20:59:00.441094	131205	914880	915330
40	2026-05-14	1027	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	915281 cuentalitros nissan	2026-05-14 17:32:41.79526	131206	2.563223e+06	2.56425e+06
41	2026-05-14	1132	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	88lt teóricos remanentes.  \nCuentalitros: 916395\nFolio Taller: 13368	2026-05-15 04:09:33.281632	131208	2.565327e+06	2.566459e+06
42	2026-05-16	1131	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	917507 folio taller 13383	2026-05-16 12:54:10.785935	131210	2.567165e+06	2.568296e+06
43	2026-05-16	701	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	CUENTA LITROS 918199, FULL	2026-05-18 15:30:52.528857	131212	2.570211e+06	2.570912e+06
44	2026-05-19	1055	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	CUENTA LITROS 919232, FOLIO 13419, REMANENTE TEORICO 169	2026-05-19 22:57:36.889606	131213	2.572235e+06	2.57329e+06
46	2026-05-22	909	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	CUENTALITROS 921236, FOLIO:13447	2026-05-23 15:47:14.773712	131215	2.576731e+06	2.57764e+06
47	2026-05-23	500	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Folio 922004.  Folio:13527	2026-05-25 05:01:46.581664	131216	2.579791e+06	2.580291e+06
48	2026-05-27	130	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Folio 13557,   Cuentalitros: 922712 FIN DIESEL 	2026-05-27 02:59:26.927228	131217	2.582674e+06	2.582804e+06
45	2026-05-21	1004	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Se rellena, el tanque traía un stock de 160 de la ex13 + remanente normal folio: 13442 , cl: 920347	2026-05-22 12:11:21.59246	131214	2.575472e+06	2.576476e+06
49	2026-05-27	1080	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Folio 13558 cuebtal 922913	2026-05-27 17:53:56.128286	131218	2.582804e+06	2.583884e+06
50	2026-05-27	543	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	FOLIO: 13570,  REMANENTE DE 640 LITROS, INICIAN PRUEBAS, SE LLENA PARA DESCARGAR EN TANQUE Y VOLVER A RELLENAR ,, CUENTALITROS 923454	2026-05-28 18:32:00.679585	131219	2.584915e+06	2.585458e+06
52	2026-05-29	701	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	FOLIO 13604 , REMANENTEN518LT, CUENTALITROS 926336	2026-05-30 03:23:50.671165	131221	2.590054e+06	2.590755e+06
53	2026-05-30	1113	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Folio: 13615 cuentwl: 927411 , rem 136	2026-06-01 12:27:05.726035	131222	2.591609e+06	2.592722e+06
54	2026-06-01	777	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	REMAN 435. FOLIO: 13618 , CUENTALITROS 928177	2026-06-01 17:44:00.361953	131223	2.592992e+06	2.593769e+06
55	2026-06-02	460	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	FOLIO : 13626 , CUENTAL: 929271 , REMAN 117	2026-06-02 15:12:17.111383	131224	2.594471e+06	2.594931e+06
56	2026-06-02	700	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	folio 13628, cuentalitros 929740	2026-06-02 19:30:36.516428	131225	2.595086e+06	2.595786e+06
57	2026-06-03	500	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	folio 13658, remanente 0, cuentalitros : 930411	2026-06-04 14:19:41.844502	131226	2.598496e+06	2.598996e+06
58	2026-06-04	500	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Folio: 13662, cuenta l: 930922 rem:30	2026-06-05 00:19:24.057846	131227	2.599256e+06	2.599756e+06
59	2026-06-05	500	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	FOLIO: 13678, CUENTAL: 931420	2026-06-05 19:46:11.684715	131229	2.600944e+06	2.601444e+06
60	2026-06-08	1131	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	CUENTALITROS: 932409\nFOLIO:13718, REMANENTE 0	2026-06-08 21:01:14.08337	131230	2.603891e+06	2.605022e+06
61	2026-06-09	979	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	cuentalitros 933369 , folio 13749	2026-06-10 01:46:26.111382	131231	2.608129e+06	2.609108e+06
62	2026-06-10	1031	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	CUENTALITROS 934360 , FOLIO: 13754	2026-06-10 22:57:28.546883	131232	2.609628e+06	2.610659e+06
63	2026-06-11	1149	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	cuentalitros: 935484 , folio : 13771 , rem:70	2026-06-11 22:38:40.362231	131233	2.611995e+06	2.613144e+06
64	2026-06-12	456	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	CUENTALITROS 935925 ,FOLIO 13786	2026-06-13 15:17:36.518379	131235	2.614352e+06	2.614808e+06
65	2026-06-13	646	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Cuentalitros 936560 folio 13826	2026-06-13 21:35:58.565883	131236	\N	\N
66	2026-06-16	909	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	cuentalitros: 937440, folio: 13862	2026-06-17 00:33:49.861295	131237	2.619784e+06	2.620693e+06
67	2026-06-19	1118	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	CUENTALITROS: 938543, FOLIO:13900, REMAN: 99LT	2026-06-19 17:37:04.714802	131239	2.624315e+06	2.625433e+06
68	2026-06-20	1051	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	939543	2026-06-22 13:16:52.566334	131240	2.627305e+06	2.628356e+06
69	2026-06-23	951	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	CUENTALITROS : 940484, FOLIO: 13943 , REM: 259	2026-06-24 00:31:31.46369	131241	2.62993e+06	2.630881e+06
70	2026-06-24	820	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	cuentalitros: 941288 , folio:14163 , reman 396	2026-06-25 00:22:34.045153	131242	2.632665e+06	2.633485e+06
71	2026-06-25	898	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	cuentalitros: 942180 1 folio: 14177 , reman :310	2026-06-26 00:24:51.500282	131243	2.634875e+06	2.635773e+06
72	2026-06-27	728	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	CUENTAIT: 942882 ,FOLIO: 14251 , REMAN: 501	2026-06-27 20:07:00.78433	131244	2.637298e+06	2.638026e+06
73	2026-06-30	996	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	REMAN 223 , FOLIO: 14288 , CUENTALITROS: 943861	2026-07-01 01:53:22.701052	1428678	2.64111e+06	2.642106e+06
74	2026-07-01	1010	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Folio 13957, cuentalitros 944882 reman 180	2026-07-02 13:14:09.00927	1428679	2.643788e+06	2.644798e+06
75	2026-07-02	1004	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	folio: 13960 , cuentalitro: 945880 reman 190	2026-07-02 22:31:10.894312	1428680	2.64499e+06	2.645994e+06
76	2026-07-03	1146	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	FOLIO : 13964, CUENTALITROS  946993 , REMAN; 87	2026-07-03 22:55:56.234231	1428682	2.646169e+06	2.647315e+06
77	2026-07-04	1073	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	FOLIO:13986 , CUENTALITROS: 948040 , REMAN 170	2026-07-04 19:47:11.60151	1428683	2.648825e+06	2.649898e+06
78	2026-07-07	1144	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	reman 98 , folio 14239 , cuentalitros 949145	2026-07-08 16:19:16.951821	1428684	2.653869e+06	2.655013e+06
79	2026-07-09	830	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Folio: 14345, reman 404 cuentalitros 949946	2026-07-09 17:33:15.246866	1428685	2.65617e+06	2.657e+06
80	2026-07-10	717	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	REMAN:505 , FOLIO: 14562, CUENTALITROS: 950648	2026-07-11 01:06:32.009686	1428686	2.65993e+06	2.660647e+06
\.


--
-- Data for Name: unidades; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.unidades (id, codigo, nombre, tipo, modelo, operador_default_id, capacidad_tanque, odometro_actual, rendimiento_referencia, activo, notas, created_at) FROM stdin;
222	R03-JCB3X	R03-JCB3X	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
235	EX12-JD50D	EX12-JD50D	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
225	EX14-PC200	EX14-PC200	maquina	\N	\N	\N	2771.5	\N	t	\N	2026-04-25 00:21:54.725736
250	US01	HILUX	otro	TOYOTA	\N	\N	1	\N	t	\N	2026-05-28 20:12:41.388817
199	CA31	CA31	camion	\N	\N	550	145170	3.19	t	\N	2026-04-25 00:21:54.725736
229	CA26 - 14M3	PZ4040B	camion	INTERNATIONAL PROSTAR 2010 VIN: 3HSCUAPR5AN178353	\N	550	796242	2.26	t	\N	2026-04-25 00:21:54.725736
227	CA07 - 14M3	PM1846A	camion	2020 KENWORTH T370  VIN: 3BKHLN9X3LF318701	\N	550	453448	2.48	t	\N	2026-04-25 00:21:54.725736
215	CA06 - 14M3	RH8840B	camion	2026 KENWORTH T480 VIN: 3BK5LJ0X3TF402168	\N	550	50740	2.64	t	\N	2026-04-25 00:21:54.725736
219	M03-KOM1020	M03-KOM1020	maquina	\N	\N	\N	2769	\N	t	\N	2026-04-25 00:21:54.725736
247	EX10 - CAT312	Excavadora	maquina	329D	\N	\N	7868	\N	t	\N	2026-05-16 00:21:33.48405
238	M01-CAT262D3	M01-CAT262D3	maquina	262D3	\N	\N	5658	\N	t	\N	2026-04-28 19:30:37.015141
210	NISSAN 03	NISSAN 03	nissan	\N	\N	\N	901915	\N	f	\N	2026-04-25 00:21:54.725736
252	CA04 - 14M3	\N	camion	\N	\N	\N	7761	\N	t	\N	2026-06-01 14:05:33.069432
256	EX-03	CAT 308E	maquina	CATERPILLAR	\N	\N	7250	\N	t	\N	2026-07-01 01:49:11.456938
253	M02	MINI02	maquina	236D SKID	\N	\N	3661.2	\N	t	\N	2026-06-05 19:36:25.67593
220	PLANTA AZUL	PLANTA AZUL	otro	\N	\N	\N	19051	\N	t	\N	2026-04-25 00:21:54.725736
212	CA15 - 14M3	RC4095A	camion	INTERNATIONAL 8600 2006 VIN: 1HSHWSBN76J248567	\N	550	2245	2.97	t	\N	2026-04-25 00:21:54.725736
208	CA19	CA19	camion	\N	\N	550	1.037162e+06	2.47	t	\N	2026-04-25 00:21:54.725736
206	CA18	CA18	camion	\N	\N	550	525358	2.8	t	\N	2026-04-25 00:21:54.725736
221	R02-KOMWB140	R02-KOMWB140	maquina	\N	\N	\N	6902	\N	t	\N	2026-04-25 00:21:54.725736
249	HAMM PATA	Rodillo para grande	maquina	Hamm	\N	\N	0	\N	t	\N	2026-05-26 22:13:59.1088
216	EX02-PC88	EX02-PC88	maquina	\N	\N	\N	5439	\N	t	\N	2026-04-25 00:21:54.725736
230	EX05-PC200	EX05-PC200	maquina	\N	\N	\N	4373	\N	t	\N	2026-04-25 00:21:54.725736
241	PLANTA VERDE	GENERADOR ELECTRICO	otro	\N	\N	\N	19345	\N	t	\N	2026-05-07 20:37:09.891019
217	RODILLO BOMAG	RODILLO BOMAG	maquina	\N	\N	\N	1048.1	\N	t	\N	2026-04-25 00:21:54.725736
254	CAMION	CAMION EN VENTA	camion	COMODIN	\N	\N	476767	\N	t	\N	2026-06-05 19:42:41.278249
244	NISSAN 03...	Mago	otro	\N	\N	\N	150673	\N	t	\N	2026-05-09 15:14:15.297908
242	CA20	\N	camion	\N	\N	\N	4420	2.3	t	\N	2026-05-07 22:59:35.188763
209	CA17-14M3	RH2191B - 2007 INTERNATIONAL	camion	VIN:1HSHWAHN17J451280,  MTO:	\N	550	50031	2.46	t	\N	2026-04-25 00:21:54.725736
207	CA12 - 14M3	PV5173B	camion	2018 FREIGHTLINER M2  VIN: 3ALHCYDJXJDJT8699	\N	550	486118	4	t	\N	2026-04-25 00:21:54.725736
255	CA05-14M3	PJ6420C	camion	KW T480	\N	380	3465	\N	t	\N	2026-06-25 23:53:23.433999
233	R04-NHB80C	R04-NHB80C	maquina	\N	\N	\N	1688	\N	t	\N	2026-04-25 00:21:54.725736
202	CA22	CA22	camion	\N	\N	600	75053	2.32	t	\N	2026-04-25 00:21:54.725736
204	CA27	CA27	camion	\N	\N	550	450039	2.41	t	\N	2026-04-25 00:21:54.725736
248	CA10	\N	camion	\N	\N	\N	562966	\N	t	\N	2026-05-16 18:52:31.858443
239	R05-CAT416F	CAT 416 F	maquina	CAT 416F RETRO	\N	\N	29982	\N	t	\N	2026-04-30 21:25:11.714929
200	CA23	CA23	camion	\N	\N	\N	644798	\N	t	\N	2026-04-25 00:21:54.725736
232	CA13 - 14M3	PL0608A	camion	2019 FREIGHTLINER M2 VIN: 3ALHCYDJ9KDKR8266	\N	550	485441	3.78	t	\N	2026-04-25 00:21:54.725736
224	EX09-PC130	EX09-PC130	maquina	\N	\N	\N	3909	\N	t	\N	2026-04-25 00:21:54.725736
214	CA28	CA28	camion	\N	\N	550	72171	3.26	t	\N	2026-04-25 00:21:54.725736
240	EX08	Excavadora	maquina	EX08-CAT307D	\N	\N	11266	\N	t	\N	2026-05-06 18:18:52.045085
198	CA29	CA29	camion	\N	\N	550	85018	3.21	t	\N	2026-04-25 00:21:54.725736
226	CA08 - 14M3	RK1054B	camion	2026 KENWORTH T480  VIN: 3BK5LJ0X6TF402438	\N	550	60553	2.84	t	\N	2026-04-25 00:21:54.725736
203	CA30	CA30	camion	\N	\N	550	133757	2.95	t	\N	2026-04-25 00:21:54.725736
196	EX07-308D	EX07-308D	maquina	\N	\N	\N	11266.3	\N	t	\N	2026-04-25 00:21:54.725736
218	EX01-JD35G	EX01-JD35G	maquina	\N	\N	\N	1485.3	\N	t	\N	2026-04-25 00:21:54.725736
234	EX13-PC210	EX13-PC210	maquina	\N	\N	\N	3830.1	\N	t	\N	2026-04-25 00:21:54.725736
197	CA32	CA32	camion	\N	\N	660	29692	2.61	t	\N	2026-04-25 00:21:54.725736
213	CA34	CA34	camion	\N	\N	\N	1.37495e+06	\N	t	\N	2026-04-25 00:21:54.725736
237	CA01-7M3	PR4832B - FREIGHTLINER M2	camion	\N	\N	\N	372931	4.8	t	\N	2026-04-28 00:32:08.529877
251	RODILLO CAT	RV06	maquina	CATERPILLAR	\N	\N	0	\N	t	\N	2026-06-01 13:54:28.629377
228	CA25	CA25	camion	\N	\N	550	11655	3	t	\N	2026-04-25 00:21:54.725736
236	RODILLO HAMM	HAMM 02	maquina	\N	\N	\N	1355	\N	t	\N	2026-04-27 22:56:09.65564
205	CA33	CA33	camion	\N	\N	600	24469	2.7	t	\N	2026-04-25 00:21:54.725736
211	CA16-14M3	RH2190B	camion	2007 INTERNATIONAL.. VIN: 1HSHWAHN47J480725 ,MTO:	\N	550	40635	2.17	t	\N	2026-04-25 00:21:54.725736
245	CA02 - 7M3	RA8157A FREIGHTLINER M2	camion	\N	\N	350	564281	5.03	t	\N	2026-05-13 00:45:11.199167
201	CA21	CA21	camion	\N	\N	550	21008	2.56	t	\N	2026-04-25 00:21:54.725736
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, name, role, phone, activo, created_at) FROM stdin;
user_3BXtpPbcUovwctUl9VhGAcpY72V	poxelbit@gmail.com	Poxel Bit	admin	\N	t	2026-03-27 21:37:07.108974
user_3BYiAC79vdFAXS59rbNLZhHcBlT	wbtaller.beto@gmail.com	Taller WB	admin	\N	t	2026-03-28 04:31:01.337097
user_3CuKdzXmgI1d8WYDYqbM6RYBVL6	wendyvnx7@gmail.com	wendy velazquez	gerente	\N	t	2026-04-26 19:01:46.577264
user_3D5zJyrz4A8zPMIqhkvt1uDAgmC	wb.construccion@gmail.com	breth velazquez	gerente	\N	t	2026-04-30 22:04:13.58751
user_3DBT90AP3udlR4XaqV3Sb51JSR1	brethv@gmail.com	Breth Velazquez	gerente	\N	t	2026-05-02 20:38:30.146666
user_3D371BhUPGwBX31tK2moNUvyel3	larajimenezmargarito@gmail.com	Margarito Lara jimenez	operador_nissan	\N	t	2026-04-29 21:38:03.785001
\.


--
-- Name: analytics_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.analytics_events_id_seq', 240, true);


--
-- Name: analytics_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.analytics_sessions_id_seq', 132, true);


--
-- Name: archivos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.archivos_id_seq', 14, true);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 11, true);


--
-- Name: cargas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.cargas_id_seq', 4046, true);


--
-- Name: fuentes_diesel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.fuentes_diesel_id_seq', 32, true);


--
-- Name: obras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.obras_id_seq', 180, true);


--
-- Name: operadores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.operadores_id_seq', 281, true);


--
-- Name: pb_mensajes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pb_mensajes_id_seq', 1, false);


--
-- Name: pb_modulos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pb_modulos_id_seq', 1, false);


--
-- Name: pb_novedades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pb_novedades_id_seq', 1, false);


--
-- Name: pb_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pb_tickets_id_seq', 1, true);


--
-- Name: periodos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.periodos_id_seq', 74, true);


--
-- Name: recargas_tanque_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.recargas_tanque_id_seq', 38, true);


--
-- Name: rendimientos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rendimientos_id_seq', 634, true);


--
-- Name: tanques_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tanques_id_seq', 16, true);


--
-- Name: transferencias_tanque_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.transferencias_tanque_id_seq', 80, true);


--
-- Name: unidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.unidades_id_seq', 256, true);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: analytics_sessions analytics_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analytics_sessions
    ADD CONSTRAINT analytics_sessions_pkey PRIMARY KEY (id);


--
-- Name: analytics_sessions analytics_sessions_session_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analytics_sessions
    ADD CONSTRAINT analytics_sessions_session_id_unique UNIQUE (session_id);


--
-- Name: archivos archivos_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archivos
    ADD CONSTRAINT archivos_key_unique UNIQUE (key);


--
-- Name: archivos archivos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archivos
    ADD CONSTRAINT archivos_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: cargas cargas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cargas
    ADD CONSTRAINT cargas_pkey PRIMARY KEY (id);


--
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (clave);


--
-- Name: fuentes_diesel fuentes_diesel_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fuentes_diesel
    ADD CONSTRAINT fuentes_diesel_pkey PRIMARY KEY (id);


--
-- Name: obras obras_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_pkey PRIMARY KEY (id);


--
-- Name: operadores operadores_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.operadores
    ADD CONSTRAINT operadores_pkey PRIMARY KEY (id);


--
-- Name: pb_mensajes pb_mensajes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pb_mensajes
    ADD CONSTRAINT pb_mensajes_pkey PRIMARY KEY (id);


--
-- Name: pb_modulos pb_modulos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pb_modulos
    ADD CONSTRAINT pb_modulos_pkey PRIMARY KEY (id);


--
-- Name: pb_novedades pb_novedades_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pb_novedades
    ADD CONSTRAINT pb_novedades_pkey PRIMARY KEY (id);


--
-- Name: pb_tickets pb_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pb_tickets
    ADD CONSTRAINT pb_tickets_pkey PRIMARY KEY (id);


--
-- Name: periodos periodos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.periodos
    ADD CONSTRAINT periodos_pkey PRIMARY KEY (id);


--
-- Name: recargas_tanque recargas_tanque_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recargas_tanque
    ADD CONSTRAINT recargas_tanque_pkey PRIMARY KEY (id);


--
-- Name: rendimientos rendimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rendimientos
    ADD CONSTRAINT rendimientos_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: tanques tanques_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tanques
    ADD CONSTRAINT tanques_pkey PRIMARY KEY (id);


--
-- Name: transferencias_tanque transferencias_tanque_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transferencias_tanque
    ADD CONSTRAINT transferencias_tanque_pkey PRIMARY KEY (id);


--
-- Name: unidades unidades_codigo_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_codigo_unique UNIQUE (codigo);


--
-- Name: unidades unidades_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict DOahy3zQSuMKR8MMxwdH6al4RwSOg3i0wdBY1LldQ3oCpHbIOafVfzqqXQI6swL

