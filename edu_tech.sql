-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.0.30 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para edu_tech
CREATE DATABASE IF NOT EXISTS `edu_tech` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `edu_tech`;

-- Volcando estructura para tabla edu_tech.asignaturas
CREATE TABLE IF NOT EXISTS `asignaturas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `docente_id` int NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `docente_id` (`docente_id`),
  CONSTRAINT `asignaturas_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.asignaturas: ~2 rows (aproximadamente)
INSERT INTO `asignaturas` (`id`, `codigo`, `nombre`, `docente_id`, `creado_en`) VALUES
	(1, 'INF101', 'Programación Básica', 2, '2026-04-17 22:04:02'),
	(2, 'INF202', 'Bases de Datos', 2, '2026-04-17 22:04:02');

-- Volcando estructura para tabla edu_tech.calificaciones
CREATE TABLE IF NOT EXISTS `calificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `estudiante_id` int NOT NULL,
  `asignatura_id` int NOT NULL,
  `periodo_academico` varchar(10) NOT NULL,
  `valor` decimal(4,2) NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `estudiante_id` (`estudiante_id`),
  KEY `asignatura_id` (`asignatura_id`),
  CONSTRAINT `calificaciones_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`usuario_id`),
  CONSTRAINT `calificaciones_ibfk_2` FOREIGN KEY (`asignatura_id`) REFERENCES `asignaturas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.calificaciones: ~2 rows (aproximadamente)
INSERT INTO `calificaciones` (`id`, `estudiante_id`, `asignatura_id`, `periodo_academico`, `valor`, `fecha_registro`) VALUES
	(1, 1, 1, '2026-1', 4.50, '2026-04-17 22:05:25'),
	(2, 1, 2, '2026-1', 4.20, '2026-04-17 22:05:25');

-- Volcando estructura para tabla edu_tech.docentes
CREATE TABLE IF NOT EXISTS `docentes` (
  `usuario_id` int NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `cubiculo` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`usuario_id`),
  CONSTRAINT `docentes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.docentes: ~1 rows (aproximadamente)
INSERT INTO `docentes` (`usuario_id`, `especialidad`, `departamento`, `cubiculo`) VALUES
	(2, 'Programación', 'Sistemas', 'B-101');

-- Volcando estructura para tabla edu_tech.estudiantes
CREATE TABLE IF NOT EXISTS `estudiantes` (
  `usuario_id` int NOT NULL,
  `codigo_estudiantil` varchar(20) NOT NULL,
  `carrera` varchar(100) DEFAULT NULL,
  `semestre_actual` int DEFAULT NULL,
  PRIMARY KEY (`usuario_id`),
  UNIQUE KEY `codigo_estudiantil` (`codigo_estudiantil`),
  CONSTRAINT `estudiantes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.estudiantes: ~0 rows (aproximadamente)
INSERT INTO `estudiantes` (`usuario_id`, `codigo_estudiantil`, `carrera`, `semestre_actual`) VALUES
	(1, 'EST-001', 'Ingeniería de Sistemas', 4);

-- Volcando estructura para tabla edu_tech.libros
CREATE TABLE IF NOT EXISTS `libros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `autor` varchar(100) NOT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `editorial` varchar(100) DEFAULT NULL,
  `cantidad_disponible` int DEFAULT '0',
  `estado` enum('DISPONIBLE','MANTENIMIENTO','BAJA') DEFAULT 'DISPONIBLE',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.libros: ~0 rows (aproximadamente)
INSERT INTO `libros` (`id`, `titulo`, `autor`, `categoria`, `editorial`, `cantidad_disponible`, `estado`, `creado_en`) VALUES
	(1, 'Clean Code', 'Robert Martin', 'Programación', 'Prentice Hall', 5, 'DISPONIBLE', '2026-04-17 22:04:02'),
	(2, 'Algoritmos', 'Thomas Cormen', 'Computación', 'MIT Press', 3, 'DISPONIBLE', '2026-04-17 22:04:02');

-- Volcando estructura para tabla edu_tech.multas
CREATE TABLE IF NOT EXISTS `multas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prestamo_id` int NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `dias_retraso` int DEFAULT '0',
  `estado` enum('PENDIENTE','PAGADA','ANULADA') DEFAULT 'PENDIENTE',
  `fecha_generacion` date DEFAULT (curdate()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `prestamo_id` (`prestamo_id`),
  CONSTRAINT `multas_ibfk_1` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.multas: ~0 rows (aproximadamente)
INSERT INTO `multas` (`id`, `prestamo_id`, `monto`, `dias_retraso`, `estado`, `fecha_generacion`) VALUES
	(1, 1, 5000.00, 2, 'PENDIENTE', '2026-04-17');

-- Volcando estructura para tabla edu_tech.pagos_multas
CREATE TABLE IF NOT EXISTS `pagos_multas` (
  `multa_id` int NOT NULL,
  `referencia_pasarela` varchar(100) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `estado` enum('PENDIENTE','APROBADO','RECHAZADO') DEFAULT 'PENDIENTE',
  `fecha_pago` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`multa_id`),
  CONSTRAINT `pagos_multas_ibfk_1` FOREIGN KEY (`multa_id`) REFERENCES `multas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.pagos_multas: ~0 rows (aproximadamente)
INSERT INTO `pagos_multas` (`multa_id`, `referencia_pasarela`, `monto`, `estado`, `fecha_pago`) VALUES
	(1, 'PAY-REF-001', 5000.00, 'PENDIENTE', '2026-04-17 22:04:02');

-- Volcando estructura para tabla edu_tech.prestamos
CREATE TABLE IF NOT EXISTS `prestamos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `libro_id` int NOT NULL,
  `estudiante_id` int NOT NULL,
  `fecha_prestamo` date DEFAULT (curdate()),
  `fecha_limite_devolucion` date NOT NULL,
  `fecha_devolucion_real` date DEFAULT NULL,
  `estado` enum('ACTIVO','DEVUELTO','VENCIDO','PERDIDO') DEFAULT 'ACTIVO',
  PRIMARY KEY (`id`),
  KEY `libro_id` (`libro_id`),
  KEY `estudiante_id` (`estudiante_id`),
  CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`libro_id`) REFERENCES `libros` (`id`),
  CONSTRAINT `prestamos_ibfk_2` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.prestamos: ~0 rows (aproximadamente)
INSERT INTO `prestamos` (`id`, `libro_id`, `estudiante_id`, `fecha_prestamo`, `fecha_limite_devolucion`, `fecha_devolucion_real`, `estado`) VALUES
	(1, 1, 1, '2026-04-17', '2026-04-24', NULL, 'ACTIVO');

-- Volcando estructura para tabla edu_tech.reservas_sala
CREATE TABLE IF NOT EXISTS `reservas_sala` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sala_id` int NOT NULL,
  `estudiante_id` int DEFAULT NULL,
  `docente_id` int DEFAULT NULL,
  `fecha_reserva` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `estado` enum('ACTIVA','CANCELADA','COMPLETADA') DEFAULT 'ACTIVA',
  PRIMARY KEY (`id`),
  KEY `sala_id` (`sala_id`),
  KEY `estudiante_id` (`estudiante_id`),
  KEY `docente_id` (`docente_id`),
  CONSTRAINT `reservas_sala_ibfk_1` FOREIGN KEY (`sala_id`) REFERENCES `salas_estudio` (`id`),
  CONSTRAINT `reservas_sala_ibfk_2` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`usuario_id`),
  CONSTRAINT `reservas_sala_ibfk_3` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.reservas_sala: ~0 rows (aproximadamente)
INSERT INTO `reservas_sala` (`id`, `sala_id`, `estudiante_id`, `docente_id`, `fecha_reserva`, `hora_inicio`, `hora_fin`, `estado`) VALUES
	(1, 1, 1, 2, '2026-04-17', '10:00:00', '12:00:00', 'ACTIVA');

-- Volcando estructura para tabla edu_tech.salas_estudio
CREATE TABLE IF NOT EXISTS `salas_estudio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `capacidad` int NOT NULL,
  `ubicacion` varchar(100) DEFAULT NULL,
  `estado` enum('DISPONIBLE','MANTENIMIENTO','INACTIVA') DEFAULT 'DISPONIBLE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.salas_estudio: ~0 rows (aproximadamente)
INSERT INTO `salas_estudio` (`id`, `nombre`, `capacidad`, `ubicacion`, `estado`) VALUES
	(1, 'Sala A', 10, 'Bloque 1', 'DISPONIBLE'),
	(2, 'Sala B', 20, 'Bloque 2', 'DISPONIBLE');

-- Volcando estructura para tabla edu_tech.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(100) NOT NULL,
  `documento_identidad` varchar(20) NOT NULL,
  `correo_institucional` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('ESTUDIANTE','DOCENTE','BIBLIOTECARIO','ADMINISTRATIVO') NOT NULL,
  `estado` enum('ACTIVO','BLOQUEADO','INACTIVO') DEFAULT 'ACTIVO',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `documento_identidad` (`documento_identidad`),
  UNIQUE KEY `correo_institucional` (`correo_institucional`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla edu_tech.usuarios: ~0 rows (aproximadamente)
INSERT INTO `usuarios` (`id`, `nombre_completo`, `documento_identidad`, `correo_institucional`, `password_hash`, `rol`, `estado`, `creado_en`, `actualizado_en`) VALUES
	(1, 'Juan Pérez', '1001', 'juan@edu.com', 'hash123', 'ESTUDIANTE', 'ACTIVO', '2026-04-17 22:04:01', '2026-04-17 22:04:01'),
	(2, 'Ana López', '1002', 'ana@edu.com', 'hash123', 'DOCENTE', 'ACTIVO', '2026-04-17 22:04:01', '2026-04-17 22:04:01'),
	(3, 'Carlos Ruiz', '1003', 'carlos@edu.com', 'hash123', 'BIBLIOTECARIO', 'ACTIVO', '2026-04-17 22:04:01', '2026-04-17 22:04:01'),
	(4, 'Laura Gómez', '1004', 'laura@edu.com', 'hash123', 'ADMINISTRATIVO', 'ACTIVO', '2026-04-17 22:04:01', '2026-04-17 22:04:01');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
