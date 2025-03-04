import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Política de privacidad de mueblesyuny.com",
  description: "Explora la Política de privacidad de mueblesyuny.com",
};

const PoliticaPage = () => {
  return (
    <div className="bg-background p-6 px-5 md:px-20">
      <section className="hero bg-background text-center py-20 border border-slate-400 drop-shadow-md mb-10">
        <div className="container mx-auto">
          <h1 className="text-4xl font-extrabold font-EB_Garamond text-foreground">
            Política de privacidad de mueblesyuny.com
          </h1>
          <p className="text-lg mt-4 font-raleway font-semibold">
            Los compradores aceptan que el pedido se puede utilizar en el
            portafolio del creador, en anuncios o en blogs; cuando sea
            necesario, la información privada no se difuminará. Si expresamente
            NO desea que su orden no sea utilizada o presentada, menciónelo en
            el área (nota al vendedor) de su compra.
          </p>
        </div>
      </section>
      <div className="bg-background p-5 md:p-20 border border-slate-400 drop-shadow-md ">
        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            INFORMACIÓN PERSONAL QUE RECOPILAMOS
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Cuando visita el Sitio, recopilamos automáticamente cierta
            información sobre su dispositivo, incluida información sobre su
            navegador web, dirección IP, zona horaria y algunas de las cookies
            que están instaladas en su dispositivo. Además, mientras navega por
            el Sitio, recopilamos información sobre las páginas web o productos
            individuales que ve, qué sitios web o términos de búsqueda lo
            remitieron al Sitio e información sobre cómo interactúa con el
            Sitio. Nos referimos a esta información recopilada automáticamente
            como (Información del dispositivo).
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Recopilamos información del dispositivo utilizando las siguientes
            tecnologías:
          </p>

          <ul className="list-disc ml-8 mt-2 font-raleway font-semibold">
            <li>
              Las cookies son archivos de datos que se colocan en su dispositivo
              o computadora y, a menudo, incluyen un identificador único
              anónimo. Para obtener más información sobre las cookies y cómo
              desactivarlas, visite
              <a href="http://www.allaboutcookies.org">
                http://www.allaboutcookies.org
              </a>
              .
            </li>
            <li>
              Los archivos de registro rastrean las acciones que ocurren en el
              Sitio y recopilan datos que incluyen su dirección IP, tipo de
              navegador, proveedor de servicios de Internet, páginas de
              referencia/salida y marcas de fecha/hora.
            </li>
            <li>
              Las balizas web, las etiquetas y los píxeles son archivos
              electrónicos que se utilizan para registrar información sobre cómo
              navega por el Sitio.
            </li>
          </ul>

          <p className="mt-2 font-raleway font-semibold">
            Además, cuando realiza una compra o intenta realizar una compra a
            través del Sitio, recopilamos cierta información suya, incluido su
            nombre, dirección de facturación, dirección de envío, información de
            pago (incluidos números de tarjetas de crédito), dirección de correo
            electrónico y número de teléfono. Nos referimos a esta información
            como (Información del pedido).
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Cuando hablamos de (Información personal) en esta Política de
            privacidad, nos referimos tanto a Información del dispositivo como a
            Información del pedido.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            ¿COMO USAMOS TU INFORMACIÓN PERSONAL?
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Usamos la Información de pedido que recopilamos generalmente para
            cumplir con cualquier pedido realizado a través del Sitio (incluido
            el procesamiento de su información de pago, la organización del
            envío y el suministro de facturas y/o confirmaciones de pedido).
            Además, utilizamos esta información de pedido para comunicarnos con
            usted y evaluar nuestros pedidos en busca de posibles riesgos o
            fraudes y, cuando esté de acuerdo con las preferencias que ha
            compartido con nosotros, brindarle información o publicidad
            relacionada con nuestros productos o servicios.
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Usamos la información del dispositivo que recopilamos para ayudarnos
            a detectar posibles riesgos y fraudes (en particular, su dirección
            IP) y, de manera más general, para mejorar y optimizar nuestro sitio
            (por ejemplo, generando análisis sobre cómo nuestros clientes
            navegan e interactúan con el Sitio y para evaluar el éxito de
            nuestras campañas de marketing y publicidad).
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            COMPARTIR SU INFORMACIÓN PERSONAL
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Compartimos su Información personal con terceros para ayudarnos a
            usar su Información personal, como se describe anteriormente. Por
            ejemplo, utilizamos Google Analytics para ayudarnos a comprender
            cómo nuestros clientes utilizan el Sitio; puede leer más sobre cómo
            Google utiliza su información personal aquí:
            https://www.google.com/intl/en/policies/privacy/. También puede
            darse de baja de Google Analytics aquí:
            https://tools.google.com/dlpage/gaoptout.
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Finalmente, también podemos compartir su Información personal para
            cumplir con las leyes y regulaciones aplicables, para responder a
            una citación, orden de registro u otra solicitud legal de
            información que recibamos, o para proteger nuestros derechos de otro
            modo.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            PUBLICIDAD CONDUCTUAL
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Como se describió anteriormente, utilizamos su información personal
            para brindarle anuncios específicos o comunicaciones de marketing
            que creemos que pueden ser de su interés. Para obtener más
            información sobre cómo funciona la publicidad dirigida, puede
            visitar la página educativa de Network Advertising Initiatives (NAI)
            en
            http://www.networkadvertising.org/understanding-online-advertising/how-does-it-work.
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Puede optar por no recibir publicidad dirigida:
          </p>
          <p className="mt-2 font-raleway font-semibold">
            FACEBOOK - https://www.facebook.com/settings/?tab=ads
          </p>
          <p className="mt-2 font-raleway font-semibold">
            GOOGLE - https://www.google.com/settings/ads/anonymous
          </p>
          <p className="mt-2 font-raleway font-semibold">
            Además, puede optar por no recibir algunos de estos servicios
            visitando el portal de exclusión de Digital Advertising Alliances
            en: http://optout.aboutads.info/.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            NO SEGUIR
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Tenga en cuenta que no modificamos las prácticas de uso y
            recopilación de datos de nuestro Sitio cuando vemos una señal de No
            rastrear desde su navegador.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">COOKIES</h2>
          <p className="mt-2 font-raleway font-semibold">
            {
              "Si deja un comentario en nuestro sitio, puede optar por guardar su nombre, dirección de correo electrónico y sitio web en cookies. Esto es para tu comodidad para que no tengas que volver a completar tus datos cuando dejes otro comentario. Estas cookies tendrán una duración de un año."
            }
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Si visita nuestra página de inicio de sesión, configuraremos una
            cookie temporal para determinar si su navegador acepta cookies. Esta
            cookie no contiene datos personales y se descarta al cerrar el
            navegador.
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Cuando inicie sesión, también configuraremos varias cookies para
            guardar su información de inicio de sesión y sus opciones de
            visualización de pantalla. Las cookies de inicio de sesión duran dos
            días y las cookies de opciones de pantalla duran un año. Si
            selecciona (Recordarme), su inicio de sesión persistirá durante dos
            semanas. Si cierra sesión en su cuenta, las cookies de inicio de
            sesión se eliminarán
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Si edita o publica un artículo, se guardará una cookie adicional en
            su navegador. Esta cookie no incluye datos personales y simplemente
            indica el ID de la publicación del artículo que acaba de editar.
            Caduca después de 1 día.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            CONTENIDO INTEGRADO DE OTROS SITIOS WEB
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Los artículos de este sitio pueden incluir contenido incrustado (por
            ejemplo, vídeos, imágenes, artículos, etc.). El contenido incrustado
            de otros sitios web se comporta exactamente de la misma manera que
            si el visitante hubiera visitado el otro sitio web.
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Estos sitios web pueden recopilar datos sobre usted, utilizar
            cookies, incorporar seguimiento adicional de terceros y monitorear
            su interacción con ese contenido incrustado, incluido el seguimiento
            de su interacción con el contenido incrustado si tiene una cuenta y
            ha iniciado sesión en ese sitio web.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            CON QUIÉN COMPARTIMOS TUS DATOS
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Si solicita un restablecimiento de contraseña, su dirección IP se
            incluirá en el correo electrónico de restablecimiento.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            CUÁNTO TIEMPO CONSERVAMOS TUS DATOS
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Si deja un comentario, el comentario y sus metadatos se conservan
            indefinidamente. Esto es para que podamos reconocer y aprobar
            cualquier comentario de seguimiento automáticamente en lugar de
            mantenerlos en una cola de moderación.
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Para los usuarios que se registran en nuestro sitio web (si los
            hay), también almacenamos la información personal que proporcionan
            en su perfil de usuario. Todos los usuarios pueden ver, editar o
            eliminar su información personal en cualquier momento (excepto que
            no pueden cambiar su nombre de usuario). Los administradores del
            sitio web también pueden ver y editar esa información.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            QUÉ DERECHOS TIENES SOBRE TUS DATOS
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Si tiene una cuenta en este sitio o ha dejado comentarios, puede
            solicitar recibir un archivo exportado de los datos personales que
            tenemos sobre usted, incluidos los datos que nos haya proporcionado.
            También puede solicitar que borremos cualquier dato personal que
            tengamos sobre usted. Esto no incluye ningún dato que estemos
            obligados a conservar con fines administrativos, legales o de
            seguridad.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            DONDE ENVIAMOS TUS DATOS
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Los comentarios de los visitantes pueden revisarse a través de un
            servicio automatizado de detección de spam.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            TUS DERECHOS
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Si es residente europeo, tiene derecho a acceder a la información
            personal que tenemos sobre usted y a solicitar que su información
            personal se corrija, actualice o elimine. Si desea ejercer este
            derecho, comuníquese con nosotros a través de la información de
            contacto a continuación.
          </p>

          <p className="mt-2 font-raleway font-semibold">
            Además, si usted es residente europeo, tomamos nota de que estamos
            procesando su información para cumplir con los contratos que podamos
            tener con usted (por ejemplo, si realiza un pedido a través del
            Sitio) o, de otro modo, para perseguir nuestros intereses
            comerciales legítimos enumerados anteriormente. Además, tenga en
            cuenta que su información se transferirá fuera de Europa, incluidos
            Canadá y Estados Unidos.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            DATA RETENTION
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Cuando realiza un pedido a través del Sitio, mantendremos la
            información de su pedido para nuestros registros a menos y hasta que
            nos solicite que eliminemos esta información.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">CAMBIOS</h2>
          <p className="mt-2 font-raleway font-semibold">
            Podemos actualizar esta política de privacidad de vez en cuando para
            reflejar, por ejemplo, cambios en nuestras prácticas o por otras
            razones operativas, legales o regulatorias.
          </p>
        </section>

        {/* Include other sections in a similar manner */}

        <section className="mb-4">
          <h2 className="text-2xl font-semibold  font-EB_Garamond">
            CONTÁCTENOS
          </h2>
          <p className="mt-2 font-raleway font-semibold">
            Para obtener más información sobre nuestras prácticas de privacidad,
            si tiene preguntas o si desea presentar una queja, comuníquese con
            nosotros por correo electrónico a{" "}
            <Link href="mailto:yunuengmc@gmail.com" className="text-secondary">
              yunuengmc@gmail.com
            </Link>
          </p>

          <address className="mt-2 font-raleway font-semibold ">
            Sahuayo de Morelos, Michoacan, Nexico
          </address>
        </section>
      </div>
    </div>
  );
};

export default PoliticaPage;
