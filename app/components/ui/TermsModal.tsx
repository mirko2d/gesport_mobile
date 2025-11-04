import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import SectionTitle from './SectionTitle';

export default function TermsModal({ visible, onClose, onAccept }: { visible: boolean; onClose: () => void; onAccept?: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center px-4">
        <View className="bg-white rounded-2xl w-full max-h-[85%] p-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xl font-extrabold text-gray-900">Términos y Condiciones</Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1 rounded-lg bg-gray-100">
              <Text className="text-gray-800 font-medium">Cerrar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="mt-2" showsVerticalScrollIndicator>
            <SectionTitle>Introducción</SectionTitle>
            <Text className="text-gray-700 leading-6 mb-4">
              Estos términos regulan el uso de la aplicación GeSPORT. Al aceptarlos, confirmás que
              entendés y aceptás cumplir las normas y condiciones descritas a continuación.
            </Text>

            <SectionTitle>Uso de la aplicación</SectionTitle>
            <Text className="text-gray-700 leading-6 mb-4">
              La aplicación provee información sobre eventos deportivos, inscripción y herramientas
              para el entrenamiento. No somos responsables por la decisión de participación en
              eventos ni por lesiones derivadas del entrenamiento.
            </Text>

            <SectionTitle>Inscripción y datos</SectionTitle>
            <Text className="text-gray-700 leading-6 mb-4">
              La inscripción a eventos puede requerir datos personales (DNI, fecha de nacimiento,
              emergencia). Es tu responsabilidad proporcionar datos verídicos. La app puede
              almacenar datos locales y en el backend según corresponda.
            </Text>

            <SectionTitle>Cancelaciones y responsabilidades</SectionTitle>
            <Text className="text-gray-700 leading-6 mb-4">
              GeSPORT se reserva el derecho de modificar o cancelar eventos. Revisá la política
              de reembolsos y cancelaciones en la web oficial o comunicándote con el organizador.
            </Text>

            <SectionTitle>Protección de datos</SectionTitle>
            <Text className="text-gray-700 leading-6 mb-4">
              Los datos personales se manejan conforme a la normativa vigente. Al aceptar estos
              términos, autorizás el tratamiento básico de tus datos necesarios para la gestión
              de inscripciones y comunicación del evento.
            </Text>

            <SectionTitle>Contacto</SectionTitle>
            <Text className="text-gray-700 leading-6 mb-8">
              Ante dudas, contactanos a contacto@gesport.example
            </Text>

            <View className="flex-row justify-end">
              <TouchableOpacity className="px-4 py-2 rounded-lg bg-primary" onPress={() => { onAccept && onAccept(); onClose(); }}>
                <Text className="text-white font-medium">Acepto</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
