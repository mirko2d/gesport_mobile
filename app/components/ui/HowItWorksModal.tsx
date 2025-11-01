import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import SectionTitle from './SectionTitle';

export default function HowItWorksModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center px-4">
        <View className="bg-white rounded-2xl w-full max-h-[85%] p-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xl font-extrabold text-gray-900">¿Cómo funciona GeSPORT?</Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1 rounded-lg bg-gray-100">
              <Text className="text-gray-800 font-medium">Cerrar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="mt-2" showsVerticalScrollIndicator={true}>
            <SectionTitle>Empezar</SectionTitle>
            <Text className="text-gray-700 leading-6 mb-4">
              Crea tu cuenta o inicia sesión desde Perfil. Así podrás inscribirte a eventos y guardar tus actividades.
            </Text>

            <SectionTitle>Eventos</SectionTitle>
            <View className="mb-4">
              <Text className="text-gray-700 leading-6">
                • Explora los próximos eventos en Inicio o en "Todos los eventos".{"\n"}
                • Cada tarjeta muestra fecha, lugar, cupos y estado.{"\n"}
                • Los eventos pasados se marcan como "Finalizado" y no permiten inscribirse.{"\n"}
                • Toca "Inscribirme" para completar tu registro (si hay cupos y no es pasado).
              </Text>
            </View>

            <SectionTitle>Actividad</SectionTitle>
            <View className="mb-4">
              <Text className="text-gray-700 leading-6">
                • Elegí modo: correr, caminar o bici.{"\n"}
                • Iniciar para comenzar; Pausa para detener; Reanudar para continuar.{"\n"}
                • Reiniciar limpia los datos de la sesión (seguro: primero pausa).{"\n"}
                • Candado: bloquea Iniciar/Reiniciar/Guardar para evitar toques accidentales.{"\n"}
                • Si das permiso de GPS, verás tu ubicación en el mapa; si no, igual podés cronometrar.
              </Text>
            </View>

            <SectionTitle>Perfil</SectionTitle>
            <View className="mb-4">
              <Text className="text-gray-700 leading-6">
                • Mira tus inscripciones activas y tus actividades locales (por usuario).{"\n"}
                • Define objetivos personales y edita tu avatar.{"\n"}
                • Los datos locales están aislados por cuenta para mayor privacidad.
              </Text>
            </View>

            <SectionTitle>Recursos</SectionTitle>
            <View className="mb-4">
              <Text className="text-gray-700 leading-6">
                • Calculadora de ritmo: estima tu pace por km.{"\n"}
                • IMC: referencia para ajustar entrenamientos y metas.
              </Text>
            </View>

            <SectionTitle>Noticias y Calendario</SectionTitle>
            <View className="mb-4">
              <Text className="text-gray-700 leading-6">
                • Noticias: novedades de la comunidad.{"\n"}
                • Calendario: vista de todos los eventos por fecha.
              </Text>
            </View>

            <SectionTitle>Roles y administración</SectionTitle>
            <View className="mb-6">
              <Text className="text-gray-700 leading-6">
                • Superadmin puede crear/editar eventos; no se permite fecha pasada.{"\n"}
                • Inscripciones a eventos pasados están bloqueadas automáticamente.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
