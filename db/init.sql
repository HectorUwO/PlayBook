-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: playbook
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `libros`
--

DROP TABLE IF EXISTS `libros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `libros` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `autor` varchar(255) NOT NULL,
  `anio` int(11) NOT NULL,
  `isbn` varchar(20) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` enum('disponible','prestado','agotado','mantenimiento') NOT NULL DEFAULT 'disponible',
  `stock` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `isbn` (`isbn`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `libros`
--

LOCK TABLES `libros` WRITE;
/*!40000 ALTER TABLE `libros` DISABLE KEYS */;
INSERT INTO `libros` VALUES (1,'Cien años de soledad','Gabriel García Márquez',2015,'9780307474728','Literatura y novelas','Una novela que narra la historia de la familia Buendía a lo largo de varias generaciones en el pueblo ficticio de Macondo. La obra combina elementos de realismo mágico con hechos históricos y sociales de América Latina.','disponible',11),(2,'La casa de los espíritus','Isabel Allende',2017,'0060951303','Literatura y novelas','Una saga familiar que narra la historia de cuatro generaciones de la familia Trueba, entrelazada con los acontecimientos políticos y sociales de Chile.','disponible',1),(3,'El Aleph','Jorge Luis Borges',2011,'8499089518','Literatura y novelas','Una colección de cuentos que exploran temas como el infinito, el tiempo, la realidad y la memoria, característicos del estilo único de Borges.','disponible',1),(4,'La sombra del viento','Carlos Ruiz Zafón',2011,'8408043641','Literatura y novelas','En la Barcelona de posguerra, un joven encuentra un libro maldito que cambiará el rumbo de su vida y le arrastrará a un misterio enterrado en el alma de la ciudad.','disponible',1),(5,'Pedro Páramo','Juan Rulfo',2014,'8437600898','Literatura y novelas','Un hombre busca a su padre en el pueblo fantasma de Comala, donde los muertos conviven con los vivos en una realidad espectral y misteriosa.','disponible',1),(6,'Ficciones','Jorge Luis Borges',2015,'8426405738','Literatura y novelas','Colección de cuentos que exploran laberintos mentales, paradojas temporales y realidades alternativas con la característica profundidad filosófica de Borges.','disponible',1),(7,'El Principito','Antoine de Saint-Exupéry',2016,'8478887199','Niños','La historia de un pequeño príncipe que viaja por diferentes planetas, descubriendo la esencia de la amistad, el amor y la vida.','disponible',1),(8,'Matilda','Roald Dahl',2016,'607011521X','Niños','La historia de una niña prodigio con poderes telequinéticos que lucha contra la injusticia y la opresión en su escuela y en su hogar.','disponible',1),(9,'El Grúfalo','Julia Donaldson',2015,'8479421398','Niños','Un cuento en rima sobre un ratón astuto que se enfrenta a varios depredadores en el bosque inventando una criatura temible llamada Grúfalo.','disponible',1),(10,'Donde viven los monstruos','Maurice Sendak',2014,'8484648664','Niños','La historia de Max, un niño que viaja a una isla habitada por monstruos y se convierte en su rey, explorando temas de imaginación y rebeldía.','disponible',1),(11,'La Telaraña de Charlotte','E.B. White',2017,'0060006986','Niños','La amistad entre una cerdita llamada Wilbur y una araña llamada Charlotte, que intenta salvar a Wilbur de ser sacrificado.','disponible',1),(12,'Pippi Calzaslargas','Astrid Lindgren',2015,'8426131921','Niños','Las aventuras de Pippi, una niña extraordinariamente fuerte y valiente que vive sola en una casa con su caballo y su mono.','disponible',1),(13,'Las Crónicas de Narnia: El León, la Bruja y el Armario','C.S. Lewis',2015,'8408137204','Niños','Cuatro hermanos descubren un mundo mágico a través de un armario y se embarcan en una aventura para salvar Narnia de la Bruja Blanca.','disponible',1),(14,'Historia del Arte','E.H. Gombrich',2016,'0714898708','Arte','Un recorrido exhaustivo por la historia del arte desde la prehistoria hasta la época contemporánea, con análisis detallados de obras y artistas.','disponible',1),(15,'Historia del arte','Ernst H. Gombrich',2011,'8489693633','Arte','Una obra clásica que ofrece una visión general de la evolución del arte a lo largo de los siglos, destacando los principales movimientos y figuras.','disponible',1),(16,'Frida: Una biografía de Frida Kahlo','Hayden Herrera',2018,'8408045806','Arte','Una biografía detallada de la vida y obra de la icónica pintora mexicana Frida Kahlo, explorando su arte, sus amores y su sufrimiento.','disponible',1),(17,'Las Vidas de los Artistas','Giorgio Vasari',2013,'019283410X','Arte','Una colección de biografías de artistas del Renacimiento, escrita por el pintor y arquitecto Giorgio Vasari, que ofrece una visión única de la época.','disponible',1),(18,'Vincent van Gogh: La biografía','Steven Naifeh',2012,'1579125867','Arte','Una biografía exhaustiva del pintor holandés Vincent van Gogh, que explora su vida, su arte y su lucha contra la enfermedad mental.','disponible',1),(19,'Técnicas de dibujo','John Ruskin',2019,'9463597727','Arte','Un manual práctico que enseña diversas técnicas de dibujo, desde el boceto hasta el dibujo detallado, con ejemplos y ejercicios.','disponible',1),(20,'El Arte Moderno','Giulio Carlo Argan',2014,'8420670731','Arte','Un análisis profundo del arte moderno, desde el impresionismo hasta el arte contemporáneo, con un enfoque en los movimientos y artistas clave.','disponible',1),(21,'La Historia de la Belleza','Umberto Eco',2015,'8426414680','Arte','Un recorrido por la historia de la belleza en el arte, la literatura y la filosofía, explorando cómo ha cambiado la percepción de la belleza a lo largo del tiempo.','disponible',1),(22,'1080 Recetas de Cocina','Simone Ortega',2019,'842069102X','Gastronomia','Un clásico de la cocina espaniola que ofrece una amplia variedad de recetas tradicionales y modernas, con instrucciones claras y detalladas.','disponible',1),(23,'La cocina y los alimentos','Harold McGee',2017,'9781118490822','Gastronomia','Una obra de referencia sobre la ciencia de la cocina, que explica los principios químicos y físicos detrás de los procesos culinarios.','disponible',1),(24,'Larousse Gastronomique','Prosper Montagné',2011,'0600615766','Gastronomia','La enciclopedia culinaria más completa, que abarca desde técnicas de cocina hasta recetas y biografías de chefs famosos.','disponible',1),(25,'El Bulli 2003-2004','Ferran Adrià',2014,'8478716734','Gastronomia','Un libro que documenta las innovadoras técnicas y recetas del famoso restaurante El Bulli durante los años 2003 y 2004.','disponible',1),(26,'Cocina Espaniola Tradicional','María Mestayer',2016,'8415877404','Gastronomia','Un compendio de recetas tradicionales de la cocina espaniola, con un enfoque en la autenticidad y el sabor.','disponible',1),(27,'El Sabor de España','Vicky Hayward',2013,'8483061805','Gastronomia','Un viaje culinario por España, explorando los sabores y tradiciones de las diferentes regiones del país.','disponible',1),(28,'Salsas: Clásicas y Modernas','Michel Roux',2018,'8484230333','Gastronomia','Un libro dedicado a las salsas, desde las clásicas hasta las más modernas, con recetas y técnicas detalladas.','disponible',1),(29,'Clean Code: Manual de desarrollo ágil de software','Robert C. Martin',2012,'8441532109','Programación','Una guía para escribir código limpio y mantenible, con principios y prácticas para el desarrollo ágil de software.','disponible',1),(30,'JavaScript: The Good Parts','Douglas Crockford',2008,'0596517742','Programación','Un análisis de las mejores características del lenguaje JavaScript, con consejos y técnicas para escribir código eficiente y robusto.','disponible',1),(31,'Patrones de Diseño','Erich Gamma',2012,'8478290591','Programación','Un libro fundamental sobre patrones de diseño, que ofrece soluciones reutilizables para problemas comunes en el desarrollo de software.','disponible',1),(32,'Python','Deutsche Ausgabe',2000,'3897211297','Programación','Una introducción al lenguaje de programación Python, con ejemplos y ejercicios para aprender a programar de manera efectiva.','disponible',1),(33,'El lenguage C','Norne ANSI',1997,'2225830355','Programación','Un manual completo sobre el lenguaje de programación C, que cubre desde los conceptos básicos hasta las técnicas avanzadas.','disponible',1),(34,'Desarrollo Web con PHP y MySQL','Manuel Torres Remon',2016,'8426723268','Programación','Una guía práctica para el desarrollo de aplicaciones web utilizando PHP y MySQL, con ejemplos y proyectos reales.','disponible',1),(35,'Java: Cómo Programar','Paul Deitel',2016,'8490355045','Programación','Un libro de referencia para aprender a programar en Java, con explicaciones detalladas y ejemplos prácticos.','disponible',1),(36,'Programación en C#','José Luis Carnero Sobrino',2022,'8426733921','Programación','Una introducción al lenguaje de programación C#, con ejemplos y ejercicios para aprender a desarrollar aplicaciones en este lenguaje.','disponible',1),(37,'Death Note, Vol. 1','Tsugumi Ohba',2011,'2505000328','Comics','La historia de un estudiante que encuentra un cuaderno con el poder de matar a cualquier persona cuyo nombre sea escrito en él.','disponible',1),(38,'One Piece, Vol. 1','Eiichiro Oda',2014,'8468471933','Comics','Las aventuras de Monkey D. Luffy y su tripulación de piratas en busca del legendario tesoro One Piece.','disponible',1),(39,'Fullmetal Alchemist, Vol. 1','Hiromu Arakawa',2012,'1421513978','Comics','La historia de dos hermanos alquimistas que buscan la Piedra Filosofal para recuperar sus cuerpos perdidos.','disponible',1),(40,'Dragon Ball, Vol. 1','Akira Toriyama',2015,'1569319200','Comics','Las aventuras de Goku, un joven guerrero con una cola de mono, en su búsqueda de las esferas del dragón.','disponible',1),(41,'Naruto, Vol. 1','Masashi Kishimoto',2011,'1421518651','Comics','La historia de Naruto Uzumaki, un joven ninja que sueña con convertirse en el Hokage, el líder de su aldea.','disponible',1),(42,'Attack on Titan, Vol. 1','Hajime Isayama',2012,'9781612620244','Comics','En un mundo donde la humanidad está al borde de la extinción debido a los titanes, un grupo de jóvenes lucha por sobrevivir y descubrir la verdad detrás de estos monstruos.','disponible',1),(43,'My Hero Academia, Vol. 1','Kohei Horikoshi',2016,'1421582694','Comics','En un mundo donde casi todos tienen superpoderes, un joven sin poderes sueña con convertirse en el héroe más grande de todos.','disponible',1),(44,'Demon Slayer, Vol. 1','Koyoharu Gotouge',2019,'1974700577','Comics','La historia de Tanjiro Kamado, un joven que se convierte en cazador de demonios para vengar a su familia y salvar a su hermana convertida en demonio.','disponible',1),(45,'Spider Man','Todd McFarlane',1995,'0752201077','Comics','Una revolucionaria interpretación del Hombre Araña que redefinió al personaje para una nueva generación de lectores.','disponible',1),(46,'Luna de pluton','Dross',2022,'9786070731747','Niños','En un lejano parque de diversiones y en plena misión secreta para defender a su amada luna de un peligroso emperador','disponible',1),(47,'Juego de tronos','George R. R. Martin',2013,'6073113110','Literatura y novelas','JLa novela ganó el Premio Locus en 1997 y fue nominada tanto al Premio Nébula como al Premio Mundial de Fantasía en el mismo año ganó el Premio Hugo a la Mejor Novela Corta en 1997. En enero de 2011, la novela se convirtió en un bestseller del New York Times y alcanzó el puesto número 1 en la lista en julio de 2011.','disponible',1),(48,'El Alquimista','Paulo Coelho',1988,'0061351342','Literatura y novelas','Combinando magia, misticismo, sabiduría y asombro en un inspirador relato de autodescubrimiento, El Alquimista se ha convertido en un clásico moderno, vendiendo millones de copias en todo el mundo y transformando la vida de innumerables lectores a lo largo de generaciones.','disponible',1),(49,'Harry Potter y la piedra filosofal','J. K. Rowling',1997,'9654487659','Literatura y novelas','\"El señor y la señora Dursley, que vivían en el número 4 de Privet Drive, estaban orgullosos de decir que eran muy normales, afortunadamente.\"','disponible',1),(52,'Moby Dick','Herman Melville',1851,'0812543076','Literatura y novelas','\"Moby Dick\" es una novela épica escrita por Herman Melville y publicada en 1851, que se ha convertido en un clásico de la literatura universal. Esta obra maestra de la narrativa pertenece a la categoría de literatura y novelas, y cuenta la historia de la obsesión del capitán Ahab por cazar a la ballena blanca Moby Dick, que había arrancado su pierna en un enfrentamiento anterior. La novela sigue al joven marinero Ishmael y su amigo Queequeg mientras se unen a la tripulación del ballenero Pequod, comandado por Ahab, y se embarcan en un viaje peligroso y emocional por los mares del mundo. A medida que la historia avanza, la búsqueda de Ahab se convierte en una metáfora de la búsqueda de la verdad, la venganza y la condición humana. Con su prosa poética y su riqueza de detalles, \"Moby Dick\" es una novela que explora temas como la naturaleza, la religión, la identidad y la búsqueda de significado, lo que la convierte en una lectura imprescindible para aquellos que buscan una obra literaria profunda y emocionante. En esta edición, los lectores pueden sumergirse en el mundo del siglo XIX y descubrir por qué \"Moby Dick\" sigue siendo una de las novelas más influyentes y queridas de la literatura universal.','disponible',1),(53,'Padre rico, padre pobre','Robert T. Kiyosaki y Sharon L. Lechter',1990,'160396181X','Literatura y novelas','\"Padre rico, padre pobre\" es una obra emblemática escrita por Robert T. Kiyosaki y Sharon L. Lechter, publicada en 1990, que se clasifica dentro de la categoría de literatura y novelas, aunque su contenido es más bien educativo y de autoayuda. A través de una narrativa autobiográfica, Kiyosaki comparte sus experiencias de infancia y cómo sus dos padres, uno rico y uno pobre, le enseñaron lecciones valiosas sobre el dinero y la riqueza. El libro explora conceptos financieros y desafía las creencias tradicionales sobre la educación, el trabajo y la inversión, brindando consejos prácticos para lograr la libertad financiera. Con un enfoque accesible y fácil de entender, \"Padre rico, padre pobre\" se ha convertido en un clásico de la literatura financiera, inspirando a millones de lectores en todo el mundo a replantear su relación con el dinero y a tomar el control de su futuro económico. Esta obra es ideal para aquellos interesados en educación financiera, inversión y desarrollo personal, y es una excelente adición a cualquier biblioteca que busque ofrecer recursos para el crecimiento y la mejora financiera de sus usuarios.','disponible',1),(54,'Don Quijote de la Mancha','Miguel de Cervantes',1600,'8495722798','Literatura y novelas','El libro \"Don Quijote de la Mancha\" es una obra maestra de la literatura española escrita por el genial autor Miguel de Cervantes. Publicada en 1605, aunque se considera que su redacción pudo iniciarse en 1600, esta novela es considerada una de las más influyentes y leídas de la historia. La historia sigue las aventuras y desventuras de Don Quijote, un noble que se Cree caballero andante y se lanza a recorrer los caminos de España en busca de justicia y honor, acompañado por su fiel escudero, Sancho Panza. A través de sus peripecias, Cervantes satiriza la sociedad y la cultura de su época, criticando la nobleza y la Iglesia, y explorando temas como la locura, la realidad y la imaginación. Con su estilo único y su sentido del humor, \"Don Quijote de la Mancha\" es una lectura emocionante y enriquecedora que sigue cautivando a los lectores después de siglos, y es considerada por muchos como el primer gran héroe de la literatura española y una de las obras más importantes de la literatura universal.','disponible',1),(55,'El proceso','Franz Kafka',2004,'8477022984','Literatura y novelas','\"El proceso\" es una novela escrita por el aclamado autor checo Franz Kafka, publicada póstumamente en 1925, aunque encontramos ediciones más recientes como la de 2004. Esta obra maestra de la literatura del siglo XX es una exploración profunda y perturbadora de la condición humana, la burocracia y la justicia. La historia sigue a Josef K., un banco empleado que se despierta un día para encontrar su vida transformada por un misterioso proceso judicial que no entiende. A medida que avanza la novela, Kafka nos sumerge en un mundo de absurdidad y desesperación, donde la lógica y la razón parecen perder todo sentido. Con su estilo único y su capacidad para crear atmósferas de inquietud y suspense, Kafka nos lleva en un viaje intelectual y emocional a través de los laberintos de la burocracia y la psique humana. \"El proceso\" es una obra que desafía al lector a reflexionar sobre la naturaleza de la justicia, la moralidad y la existencia, y que sigue siendo relevante y aterradora en la actualidad, lo que la convierte en una lectura obligatoria para aquellos que buscan explorar las profundidades de la condición humana.','disponible',1);
/*!40000 ALTER TABLE `libros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prestamos`
--

DROP TABLE IF EXISTS `prestamos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prestamos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `libro_id` int(11) NOT NULL,
  `fecha_prestamo` date NOT NULL DEFAULT current_timestamp(),
  `fecha_devolucion` date DEFAULT NULL,
  `fecha_devolucion_sugerida` date DEFAULT (current_timestamp() + interval 5 day),
  `estado` enum('activo','devuelto') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `libro_id` (`libro_id`),
  CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `prestamos_ibfk_2` FOREIGN KEY (`libro_id`) REFERENCES `libros` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prestamos`
--

LOCK TABLES `prestamos` WRITE;
/*!40000 ALTER TABLE `prestamos` DISABLE KEYS */;
INSERT INTO `prestamos` VALUES (27,1,1,'2025-02-24','2025-02-24','2025-03-01','devuelto'),(28,1,2,'2025-02-24','2025-04-15','2025-03-01','devuelto'),(29,1,2,'2025-04-15','2025-04-15','2025-04-20','devuelto'),(30,1,2,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(31,1,3,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(32,2,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(33,2,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(34,2,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(35,2,2,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(36,2,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(37,1,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(38,3,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(39,2,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(40,1,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(41,3,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(42,2,2,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(43,2,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(45,2,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(48,2,1,'2025-04-27','2025-04-27','2025-05-02','devuelto'),(49,2,1,'2025-04-27','2025-04-27','2025-05-02','devuelto');
/*!40000 ALTER TABLE `prestamos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes`
--

DROP TABLE IF EXISTS `solicitudes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `libro_id` int(11) NOT NULL,
  `estado` enum('pendiente','aprobada','denegada') NOT NULL DEFAULT 'pendiente',
  `fecha_solicitud` date NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `libro_id` (`libro_id`),
  CONSTRAINT `solicitudes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `solicitudes_ibfk_2` FOREIGN KEY (`libro_id`) REFERENCES `libros` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes`
--

LOCK TABLES `solicitudes` WRITE;
/*!40000 ALTER TABLE `solicitudes` DISABLE KEYS */;
INSERT INTO `solicitudes` VALUES (26,1,1,'aprobada','2025-02-24'),(27,1,1,'aprobada','2025-02-24'),(28,1,1,'aprobada','2025-02-24'),(29,1,1,'aprobada','2025-02-24'),(30,1,1,'denegada','2025-02-24'),(31,1,1,'aprobada','2025-02-24'),(32,1,1,'aprobada','2025-02-24'),(33,1,1,'denegada','2025-02-24'),(34,1,48,'denegada','2025-02-24'),(35,1,1,'denegada','2025-02-24'),(36,1,2,'aprobada','2025-02-24'),(37,2,3,'denegada','2025-03-18'),(38,2,4,'denegada','2025-03-18'),(39,1,2,'denegada','2025-04-15'),(40,1,1,'denegada','2025-04-15'),(41,1,2,'aprobada','2025-04-15'),(42,1,1,'denegada','2025-04-15'),(43,1,2,'denegada','2025-04-26'),(44,1,1,'denegada','2025-04-27'),(45,1,2,'denegada','2025-04-27'),(46,1,2,'aprobada','2025-04-27'),(47,1,3,'aprobada','2025-04-27'),(48,1,2,'denegada','2025-04-27'),(49,1,2,'denegada','2025-04-27');
/*!40000 ALTER TABLE `solicitudes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `rol` enum('admin','usuario') NOT NULL DEFAULT 'usuario',
  `fechaderegistro` date DEFAULT current_timestamp(),
  `constraseña` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','admin@biblioteca.com','admin','2025-02-23','admin'),(2,'Hector','hectorcnto@gmail.com','usuario','2025-02-23','hector'),(3,'Juan Cordova','juan@biblioteca.com','usuario','2025-02-24','juan');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-27 20:47:06
