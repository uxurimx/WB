--
-- PostgreSQL database dump
--

\restrict 2TUT3gnAJEUjPOschJuqw0lQiOD2YndHaeiMy6AzuCRJdi0yQYyse9WOHvy3Ohc

-- Dumped from database version 17.8 (ad62774)
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
    folio integer
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
-- Data for Name: archivos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.archivos (id, url, key, nombre, tipo, carga_id, subido_por_id, created_at) FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_log (id, usuario_id, accion, entidad, entidad_id, datos_json, created_at) FROM stdin;
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
2779	2026-05-07	09:07:00	11595	60	197	240	152	30	16	50	11970	5247	5295	campo	normal	\N	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-07 15:22:29.365911	239	240	f
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
\.


--
-- Data for Name: configuracion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.configuracion (clave, valor, updated_at) FROM stdin;
folio_base	13451	2026-04-28 23:52:27.836
alerta_rendimiento_dias	5	2026-05-02 03:42:53.429326
tolerancia_rendimiento	0.0500	2026-05-02 03:42:56.655
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
249	Antonio Torres	chofer	\N	t	2026-04-25 00:21:54.759065
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
261	Arq Cordero	chofer	\N	t	2026-04-25 00:21:54.759065
262	Javier	chofer	\N	t	2026-04-25 00:21:54.759065
263	Otoniel	chofer	\N	t	2026-04-25 00:21:54.759065
264	Yoshua	chofer	\N	t	2026-04-25 00:21:54.759065
265	Tobias	chofer	\N	t	2026-04-25 00:21:54.759065
266	Christopher	chofer	\N	t	2026-04-25 00:21:54.759065
267	Bernabe	chofer	\N	t	2026-04-25 00:21:54.759065
268	Ivan Niño	chofer	\N	t	2026-04-25 00:21:54.759065
269	Luis Medina	chofer	\N	t	2026-04-25 00:21:54.759065
270	Rodrigo	chofer	\N	t	2026-04-25 00:21:54.759065
271	Carlos Marcial	chofer	\N	t	2026-04-25 00:21:54.759065
272	Benito arroyo	chofer	\N	t	2026-04-25 00:21:54.759065
273	Fancisco	chofer	\N	t	2026-04-25 00:21:54.759065
274	Manuel	chofer	\N	t	2026-04-25 00:21:54.759065
276	Angel	chofer	\N	t	2026-04-29 14:59:38.98286
277	Arq Cordiero	chofer	\N	t	2026-04-29 20:34:30.125641
\.


--
-- Data for Name: periodos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.periodos (id, nombre, fecha_inicio, fecha_fin, cerrado, cerrado_por_id, cerrado_at, created_at) FROM stdin;
60	2 de mayo al 8 de mayo de 2026	2026-05-02	2026-05-08	f	\N	\N	2026-05-02 00:48:07.49846
62	28 de marzo al 3 de abril de 2026	2026-03-28	2026-04-03	f	\N	\N	2026-05-02 00:49:36.136234
61	25 de abril al 1 de mayo de 2026	2026-04-25	2026-05-01	t	user_3BYiAC79vdFAXS59rbNLZhHcBlT	2026-05-02 03:44:47.256	2026-05-02 00:49:36.109522
\.


--
-- Data for Name: recargas_tanque; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recargas_tanque (id, fecha, litros, proveedor, folio_factura, precio_litro, tanque_id, registrado_por_id, notas, created_at, cuentalitros_inicio) FROM stdin;
33	2026-05-02	19807	DOS AGUILAS (PEMEX)	MT41953	26.21	15	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-02 19:05:54.186131	2.543768e+06
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
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, label, permisos, is_system) FROM stdin;
gerente	Gerente	["cargas.historial","cargas.nueva_patio","cargas.nueva_campo","catalogo","periodos","dashboard","settings"]	t
operador_nissan	Operador NISSAN	["cargas.nueva_campo"]	t
encargado_obra	Encargado de Obra	["cargas.historial"]	t
chofer	Chofer	["cargas.historial"]	t
admin	Administrador	["cargas.historial","cargas.nueva_patio","cargas.nueva_campo","catalogo","periodos","admin","settings","dashboard"]	t
wendy	Administración	["dashboard","catalogo","cargas.nueva_patio","cargas.nueva_campo","cargas.historial","periodos","admin"]	f
wendy2	Admin	["dashboard","cargas.nueva_campo","cargas.nueva_patio","catalogo","periodos","cargas.historial"]	f
wendy_vn	Adminnnn	["dashboard","cargas.historial","catalogo","periodos"]	f
despachador	Despachador	["cargas.nueva_patio","catalogo","cargas.historial"]	t
\.


--
-- Data for Name: tanques; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tanques (id, nombre, capacidad_max, litros_actuales, cuentalitros_actual, ajuste_porcentaje, ultima_actualizacion) FROM stdin;
16	NISSAN	1200	197	5656	2	2026-05-07 22:03:40.366
15	Taller	21001	9832	2.55383e+06	2	2026-05-07 23:00:16.413
\.


--
-- Data for Name: transferencias_tanque; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transferencias_tanque (id, fecha, litros, tanque_origen_id, tanque_destino_id, registrado_por_id, notas, created_at, folio) FROM stdin;
28	2026-05-02	990	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-02 16:18:30.399248	13490
29	2026-05-04	1149	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	\N	2026-05-04 23:30:45.150953	13501
30	2026-05-05	1109	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	cuenta litros 908580, folio 13166	2026-05-05 18:55:57.037905	13502
31	2026-05-06	245	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	Recarga, solo surtió ex14	2026-05-06 01:28:01.632674	13503
32	2026-05-06	1065	15	16	user_3BYiAC79vdFAXS59rbNLZhHcBlT	full	2026-05-06 23:16:53.732344	13504
\.


--
-- Data for Name: unidades; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.unidades (id, codigo, nombre, tipo, modelo, operador_default_id, capacidad_tanque, odometro_actual, rendimiento_referencia, activo, notas, created_at) FROM stdin;
196	EX07-308D	EX07-308D	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
217	RODILLO BOMAG	RODILLO BOMAG	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
219	M03-KOM1020	M03-KOM1020	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
221	R02-KOMWB140	R02-KOMWB140	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
222	R03-JCB3X	R03-JCB3X	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
224	EX09-PC130	EX09-PC130	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
235	EX12-JD50D	EX12-JD50D	maquina	\N	\N	\N	0	\N	t	\N	2026-04-25 00:21:54.725736
240	EX08	Excavadora	maquina	EX08-CAT307D	\N	\N	0	\N	t	\N	2026-05-06 18:18:52.045085
238	M01-CAT262D3	M01-CAT262D3	maquina	262D3	\N	\N	5627	\N	t	\N	2026-04-28 19:30:37.015141
210	NISSAN 03	NISSAN 03	nissan	\N	\N	\N	901915	\N	t	\N	2026-04-25 00:21:54.725736
203	CA30	CA30	camion	\N	\N	550	123785	2.95	t	\N	2026-04-25 00:21:54.725736
237	CA01	7m3	camion	Freightliner m2	\N	\N	371546	4.8	t	\N	2026-04-28 00:32:08.529877
199	CA31	CA31	camion	\N	\N	550	133528	3.19	t	\N	2026-04-25 00:21:54.725736
201	CA21	CA21	camion	\N	\N	550	11532	2.56	t	\N	2026-04-25 00:21:54.725736
213	CA34	CA34	camion	\N	\N	\N	1.365976e+06	\N	t	\N	2026-04-25 00:21:54.725736
234	EX13-PC210	EX13-PC210	maquina	\N	\N	\N	3650.3	\N	t	\N	2026-04-25 00:21:54.725736
208	CA19	CA19	camion	\N	\N	550	1.028845e+06	2.47	t	\N	2026-04-25 00:21:54.725736
216	EX02-PC88	EX02-PC88	maquina	\N	\N	\N	5202	\N	t	\N	2026-04-25 00:21:54.725736
202	CA22	CA22	camion	\N	\N	600	63561	2.32	t	\N	2026-04-25 00:21:54.725736
204	CA27	CA27	camion	\N	\N	550	439784	2.41	t	\N	2026-04-25 00:21:54.725736
211	CA16	CA16	camion	\N	\N	550	31486	2.17	t	\N	2026-04-25 00:21:54.725736
209	CA17	CA17	camion	\N	\N	550	39184	2.46	t	\N	2026-04-25 00:21:54.725736
207	CA12	CA12	camion	\N	\N	550	483778	4	t	\N	2026-04-25 00:21:54.725736
230	EX05-PC200	EX05-PC200	maquina	\N	\N	\N	4179	\N	t	\N	2026-04-25 00:21:54.725736
232	CA13	CA13	camion	\N	\N	550	475685	3.78	t	\N	2026-04-25 00:21:54.725736
197	CA32	CA32	camion	\N	\N	660	11970	2.61	t	\N	2026-04-25 00:21:54.725736
218	EX01-JD35G	EX01-JD35G	maquina	\N	\N	\N	1435	\N	t	\N	2026-04-25 00:21:54.725736
225	EX14-PC200	EX14-PC200	maquina	\N	\N	\N	2607.7	\N	t	\N	2026-04-25 00:21:54.725736
220	PLANTA AZUL	PLANTA AZUL	maquina	\N	\N	\N	19051	\N	t	\N	2026-04-25 00:21:54.725736
233	R04-NHB80C	R04-NHB80C	maquina	\N	\N	\N	1374.3	\N	t	\N	2026-04-25 00:21:54.725736
241	PLANTA VERDE	GENERADOR ELECTRICO	otro	\N	\N	\N	0	\N	t	\N	2026-05-07 20:37:09.891019
236	HAMM 02	HAMM 02	maquina	\N	\N	\N	0	\N	t	\N	2026-04-27 22:56:09.65564
214	CA28	CA28	camion	\N	\N	550	61923	3.26	t	\N	2026-04-25 00:21:54.725736
229	CA26	CA26	camion	\N	\N	550	786006	2.26	t	\N	2026-04-25 00:21:54.725736
226	CA08	CA08	camion	\N	\N	550	48929	2.84	t	\N	2026-04-25 00:21:54.725736
206	CA18	CA18	camion	\N	\N	550	513300	2.8	t	\N	2026-04-25 00:21:54.725736
227	CA07	CA07	camion	\N	\N	550	450197	2.48	t	\N	2026-04-25 00:21:54.725736
205	CA33	CA33	camion	\N	\N	600	16366	2.7	t	\N	2026-04-25 00:21:54.725736
239	R05-CAT416F	CAT 416 F	maquina	CAT 416F RETRO	\N	\N	29982	\N	t	\N	2026-04-30 21:25:11.714929
228	CA25	CA25	camion	\N	\N	550	2655	3	t	\N	2026-04-25 00:21:54.725736
215	CA06	CA06	camion	\N	\N	550	43212	2.64	t	\N	2026-04-25 00:21:54.725736
198	CA29	CA29	camion	\N	\N	550	76777	3.21	t	\N	2026-04-25 00:21:54.725736
200	CA23	CA23	camion	\N	\N	\N	641093	\N	t	\N	2026-04-25 00:21:54.725736
242	CA20	\N	camion	\N	\N	\N	44614	2.3	t	\N	2026-05-07 22:59:35.188763
212	CA15	CA15	camion	\N	\N	550	42938	2.97	t	\N	2026-04-25 00:21:54.725736
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, name, role, phone, activo, created_at) FROM stdin;
user_3BXtpPbcUovwctUl9VhGAcpY72V	poxelbit@gmail.com	Poxel Bit	admin	\N	t	2026-03-27 21:37:07.108974
user_3BYiAC79vdFAXS59rbNLZhHcBlT	wbtaller.beto@gmail.com	Taller WB	admin	\N	t	2026-03-28 04:31:01.337097
user_3CuKdzXmgI1d8WYDYqbM6RYBVL6	wendyvnx7@gmail.com	wendy velazquez	gerente	\N	t	2026-04-26 19:01:46.577264
user_3D371BhUPGwBX31tK2moNUvyel3	larajimenezmargarito@gmail.com	Margarito Lara jimenez	operador_nissan	\N	t	2026-04-29 21:38:03.785001
user_3D5zJyrz4A8zPMIqhkvt1uDAgmC	wb.construccion@gmail.com	breth velazquez	gerente	\N	t	2026-04-30 22:04:13.58751
user_3DBT90AP3udlR4XaqV3Sb51JSR1	brethv@gmail.com	Breth Velazquez	gerente	\N	t	2026-05-02 20:38:30.146666
\.


--
-- Name: archivos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.archivos_id_seq', 12, true);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 1, false);


--
-- Name: cargas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.cargas_id_seq', 2793, true);


--
-- Name: fuentes_diesel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.fuentes_diesel_id_seq', 32, true);


--
-- Name: obras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.obras_id_seq', 154, true);


--
-- Name: operadores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.operadores_id_seq', 277, true);


--
-- Name: periodos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.periodos_id_seq', 62, true);


--
-- Name: recargas_tanque_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.recargas_tanque_id_seq', 33, true);


--
-- Name: rendimientos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rendimientos_id_seq', 306, true);


--
-- Name: tanques_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tanques_id_seq', 16, true);


--
-- Name: transferencias_tanque_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.transferencias_tanque_id_seq', 32, true);


--
-- Name: unidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.unidades_id_seq', 242, true);


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

\unrestrict 2TUT3gnAJEUjPOschJuqw0lQiOD2YndHaeiMy6AzuCRJdi0yQYyse9WOHvy3Ohc

