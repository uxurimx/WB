--
-- PostgreSQL database dump
--

\restrict XJnnLQfmRwTLdTfR9pL46Yh0nJYNLLtkGbAJoq8bO7dfHDNgyjBmKKY85hFKlJB

-- Dumped from database version 17.10 (8e4c665)
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
54	fcf51eae-af16-4ed7-9d51-f7d5e4e299e7	mobile	chrome	android	1024	1024	\N	35.88	7	0	t	2026-06-02 21:44:26.017	2026-06-02 21:44:19.639422
55	9cf08998-4a39-4ff0-adb7-1dee5a587577	desktop	chrome	macos	1024	898	\N	158.173	3	0	t	2026-06-05 02:15:26.215	2026-06-05 02:15:25.392481
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
\.


--
-- Data for Name: configuracion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.configuracion (clave, valor, updated_at) FROM stdin;
folio_base	13108	2026-05-08 22:05:19.279
folio_base_campo	11645	2026-05-22 17:17:57.097
tolerancia_rendimiento	0.0500	2026-05-25 14:29:00.632
alerta_rendimiento_dias	3	2026-05-25 14:29:07.425
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
250	Jose Arroyo	chofer	\N	t	2026-04-25 00:21:54.759065
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
66	30 de mayo al 5 de junio de 2026	2026-05-30	2026-06-05	f	\N	\N	2026-05-30 01:19:22.141683
65	23 de mayo al 29 de mayo de 2026	2026-05-23	2026-05-29	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-30 03:58:38.553	2026-05-23 15:32:10.118799
\.


--
-- Data for Name: recargas_tanque; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recargas_tanque (id, fecha, litros, proveedor, folio_factura, precio_litro, tanque_id, registrado_por_id, notas, created_at, cuentalitros_inicio) FROM stdin;
33	2026-05-02	19807	DOS AGUILAS (PEMEX)	MT41953	26.21	15	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-02 19:05:54.186131	2.543768e+06
34	2026-05-14	19823	2 Aguilas (PEMEX)	MT 42409	26.21	15	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-14 16:39:45.216819	2.563222e+06
35	2026-05-27	20000	\N	\N	\N	15	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-27 17:53:35.008499	2.582804e+06
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
16	NISSAN	1200	290	931630	2	2026-06-05 23:54:09.398
15	Taller	21001	2625	2.601444e+06	2	2026-06-05 19:46:11.681
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
\.


--
-- Data for Name: unidades; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.unidades (id, codigo, nombre, tipo, modelo, operador_default_id, capacidad_tanque, odometro_actual, rendimiento_referencia, activo, notas, created_at) FROM stdin;
217	RODILLO BOMAG	RODILLO BOMAG	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
222	R03-JCB3X	R03-JCB3X	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
235	EX12-JD50D	EX12-JD50D	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
199	CA31	CA31	camion	\N	\N	550	137926	3.19	t	\N	2026-04-25 00:21:54.725736
205	CA33	CA33	camion	\N	\N	600	20063	2.7	t	\N	2026-04-25 00:21:54.725736
210	NISSAN 03	NISSAN 03	nissan	\N	\N	\N	901915	\N	t	\N	2026-04-25 00:21:54.725736
206	CA18	CA18	camion	\N	\N	550	518636	2.8	t	\N	2026-04-25 00:21:54.725736
245	CA02 - 7M3	RA8157A	camion	FREIGHTLINER M2	\N	350	561895	5.03	t	\N	2026-05-13 00:45:11.199167
204	CA27	CA27	camion	\N	\N	550	443671	2.41	t	\N	2026-04-25 00:21:54.725736
202	CA22	CA22	camion	\N	\N	600	69386	2.32	t	\N	2026-04-25 00:21:54.725736
238	M01-CAT262D3	M01-CAT262D3	maquina	262D3	\N	\N	5658	\N	t	\N	2026-04-28 19:30:37.015141
207	CA12 - 14M3	PV5173B	camion	2018 FREIGHTLINER M2  VIN: 3ALHCYDJXJDJT8699	\N	550	485591	4	t	\N	2026-04-25 00:21:54.725736
229	CA26 - 14M3	PZ4040B	camion	INTERNATIONAL PROSTAR 2010 VIN: 3HSCUAPR5AN178353	\N	550	790928	2.26	t	\N	2026-04-25 00:21:54.725736
198	CA29	CA29	camion	\N	\N	550	80524	3.21	t	\N	2026-04-25 00:21:54.725736
224	EX09-PC130	EX09-PC130	maquina	\N	\N	\N	3848	\N	t	\N	2026-04-25 00:21:54.725736
244	NISSAN 03...	Mago	otro	\N	\N	\N	150391	\N	t	\N	2026-05-09 15:14:15.297908
216	EX02-PC88	EX02-PC88	maquina	\N	\N	\N	5308	\N	t	\N	2026-04-25 00:21:54.725736
249	HAMM PATA	Rodillo para grande	maquina	Hamm	\N	\N	0	\N	t	\N	2026-05-26 22:13:59.1088
230	EX05-PC200	EX05-PC200	maquina	\N	\N	\N	4373	\N	t	\N	2026-04-25 00:21:54.725736
208	CA19	CA19	camion	\N	\N	550	1.032063e+06	2.47	t	\N	2026-04-25 00:21:54.725736
215	CA06 - 14M3	RH8840B	camion	2026 KENWORTH T480 VIN: 3BK5LJ0X3TF402168	\N	550	47080	2.64	t	\N	2026-04-25 00:21:54.725736
197	CA32	CA32	camion	\N	\N	660	24022	2.61	t	\N	2026-04-25 00:21:54.725736
242	CA20	\N	camion	\N	\N	\N	46118	2.3	t	\N	2026-05-07 22:59:35.188763
227	CA07 - 14M3	PM1846A	camion	2020 KENWORTH T370  VIN: 3BKHLN9X3LF318701	\N	550	452560	2.48	t	\N	2026-04-25 00:21:54.725736
228	CA25	CA25	camion	\N	\N	550	5510	3	t	\N	2026-04-25 00:21:54.725736
219	M03-KOM1020	M03-KOM1020	maquina	\N	\N	\N	2769	\N	t	\N	2026-04-25 00:21:54.725736
221	R02-KOMWB140	R02-KOMWB140	maquina	\N	\N	\N	6902	\N	t	\N	2026-04-25 00:21:54.725736
220	PLANTA AZUL	PLANTA AZUL	otro	\N	\N	\N	19051	\N	t	\N	2026-04-25 00:21:54.725736
253	M02	MINI02	maquina	236D SKID	\N	\N	3629	\N	t	\N	2026-06-05 19:36:25.67593
236	RODILLO HAMM	HAMM 02	maquina	\N	\N	\N	1354	\N	t	\N	2026-04-27 22:56:09.65564
254	CAMION	CAMION EN VENTA	camion	COMODIN	\N	\N	0	\N	t	\N	2026-06-05 19:42:41.278249
211	CA16	CA16	camion	\N	\N	550	35482	2.17	t	\N	2026-04-25 00:21:54.725736
214	CA28	CA28	camion	\N	\N	550	67057	3.26	t	\N	2026-04-25 00:21:54.725736
239	R05-CAT416F	CAT 416 F	maquina	CAT 416F RETRO	\N	\N	29982	\N	t	\N	2026-04-30 21:25:11.714929
252	CA04 - 14M3	\N	camion	\N	\N	\N	1617	\N	t	\N	2026-06-01 14:05:33.069432
237	CA01-7M3	PR4832B	camion	FREIGHTLINER M2	\N	\N	372171	4.8	t	\N	2026-04-28 00:32:08.529877
203	CA30	CA30	camion	\N	\N	550	128532	2.95	t	\N	2026-04-25 00:21:54.725736
250	US01	HILUX	otro	TOYOTA	\N	\N	1	\N	t	\N	2026-05-28 20:12:41.388817
240	EX08	Excavadora	maquina	EX08-CAT307D	\N	\N	11266	\N	t	\N	2026-05-06 18:18:52.045085
212	CA15 - 14M3	RC4095A	camion	INTERNATIONAL 8600 2006 VIN: 1HSHWSBN76J248567	\N	550	48181	2.97	t	\N	2026-04-25 00:21:54.725736
201	CA21	CA21	camion	\N	\N	550	15143	2.56	t	\N	2026-04-25 00:21:54.725736
213	CA34	CA34	camion	\N	\N	\N	1.369677e+06	\N	t	\N	2026-04-25 00:21:54.725736
247	EX10 - CAT312	Excavadora	maquina	329D	\N	\N	0	\N	t	\N	2026-05-16 00:21:33.48405
209	CA17	CA17	camion	\N	\N	550	43870	2.46	t	\N	2026-04-25 00:21:54.725736
200	CA23	CA23	camion	\N	\N	\N	642720	\N	t	\N	2026-04-25 00:21:54.725736
196	EX07-308D	EX07-308D	maquina	\N	\N	\N	11266.3	\N	t	\N	2026-04-25 00:21:54.725736
241	PLANTA VERDE	GENERADOR ELECTRICO	otro	\N	\N	\N	19345	\N	t	\N	2026-05-07 20:37:09.891019
225	EX14-PC200	EX14-PC200	maquina	\N	\N	\N	2675.7	\N	t	\N	2026-04-25 00:21:54.725736
218	EX01-JD35G	EX01-JD35G	maquina	\N	\N	\N	1437	\N	t	\N	2026-04-25 00:21:54.725736
233	R04-NHB80C	R04-NHB80C	maquina	\N	\N	\N	1524	\N	t	\N	2026-04-25 00:21:54.725736
248	CA10	\N	camion	\N	\N	\N	562888	\N	t	\N	2026-05-16 18:52:31.858443
226	CA08 - 14M3	RK1054B	camion	2026 KENWORTH T480  VIN: 3BK5LJ0X6TF402438	\N	550	54147	2.84	t	\N	2026-04-25 00:21:54.725736
251	RODILLO CAT	RV06	maquina	CATERPILLAR	\N	\N	0	\N	t	\N	2026-06-01 13:54:28.629377
232	CA13 - 14M3	PL0608A	camion	2019 FREIGHTLINER M2 VIN: 3ALHCYDJ9KDKR8266	\N	550	479771	3.78	t	\N	2026-04-25 00:21:54.725736
234	EX13-PC210	EX13-PC210	maquina	\N	\N	\N	3699.1	\N	t	\N	2026-04-25 00:21:54.725736
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

SELECT pg_catalog.setval('public.analytics_events_id_seq', 99, true);


--
-- Name: analytics_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.analytics_sessions_id_seq', 55, true);


--
-- Name: archivos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.archivos_id_seq', 14, true);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 3, true);


--
-- Name: cargas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.cargas_id_seq', 3340, true);


--
-- Name: fuentes_diesel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.fuentes_diesel_id_seq', 32, true);


--
-- Name: obras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.obras_id_seq', 170, true);


--
-- Name: operadores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.operadores_id_seq', 278, true);


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

SELECT pg_catalog.setval('public.pb_tickets_id_seq', 1, false);


--
-- Name: periodos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.periodos_id_seq', 66, true);


--
-- Name: recargas_tanque_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.recargas_tanque_id_seq', 35, true);


--
-- Name: rendimientos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rendimientos_id_seq', 455, true);


--
-- Name: tanques_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tanques_id_seq', 16, true);


--
-- Name: transferencias_tanque_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.transferencias_tanque_id_seq', 59, true);


--
-- Name: unidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.unidades_id_seq', 254, true);


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

\unrestrict XJnnLQfmRwTLdTfR9pL46Yh0nJYNLLtkGbAJoq8bO7dfHDNgyjBmKKY85hFKlJB

