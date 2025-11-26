import { FileText, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import SectionTitle from './SectionTitle';

type TermsModalProps = {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  initialTab?: 'terms' | 'waiver';
  termsTitle?: string;
  termsContent?: React.ReactNode;
  waiverTitle?: string;
  waiverContent?: React.ReactNode;
};

export default function TermsModal({ visible, onClose, onAccept, initialTab = 'terms', termsTitle, termsContent, waiverTitle, waiverContent }: TermsModalProps) {
  const [tab, setTab] = useState<'terms' | 'waiver'>(initialTab);
  // Sincroniza cambios de la prop initialTab cuando se abre desde diferentes botones
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Fallback genéricos si no se provee contenido
  const genericTerms = useMemo(() => (
    <View>
      <SectionTitle>Introducción</SectionTitle>
      <Text className="text-gray-700 leading-6 mb-5 text-base">
        Estos términos regulan el uso de la aplicación GeSPORT. Al aceptarlos, confirmás que
        entendés y aceptás cumplir las normas y condiciones descritas a continuación.
      </Text>
      <SectionTitle>Inscripción y datos</SectionTitle>
      <Text className="text-gray-700 leading-6 mb-5 text-base">
        La inscripción a eventos puede requerir datos personales (DNI, fecha de nacimiento,
        emergencia). Es tu responsabilidad proporcionar datos verídicos. La app puede
        almacenar datos locales y en el backend según corresponda.
      </Text>
    </View>
  ), []);

  const genericWaiver = useMemo(() => (
    <View>
      <SectionTitle>Descargo de responsabilidad</SectionTitle>
      <Text className="text-gray-700 leading-6 mb-5 text-base">
        Participar en actividades deportivas implica riesgos inherentes. Al aceptar, declarás estar
        en condiciones de salud adecuadas y asumís los riesgos derivados de tu participación.
      </Text>
    </View>
  ), []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40">
        <View className="flex-1 bg-white rounded-t-3xl mt-4 overflow-hidden">
          {/* Header */}
          <View className="bg-gradient-to-r from-primary to-primary/80 px-6 pt-6 pb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <FileText size={28} color="#fff" />
                <Text className="text-2xl font-extrabold text-white">
                  {tab === 'terms' ? (termsTitle || 'Términos y Condiciones') : (waiverTitle || 'Descargo de responsabilidad')}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} className="bg-white/20 p-2 rounded-full">
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Tabs */}
            <View className="flex-row mt-3 bg-white/15 rounded-full p-1 self-start">
              <TouchableOpacity onPress={() => setTab('terms')} className={`px-4 py-1.5 rounded-full ${tab === 'terms' ? 'bg-white' : ''}`}>
                <Text className={`${tab === 'terms' ? 'text-primary font-semibold' : 'text-white'}`}>Términos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTab('waiver')} className={`px-4 py-1.5 rounded-full ${tab === 'waiver' ? 'bg-white' : ''}`}>
                <Text className={`${tab === 'waiver' ? 'text-primary font-semibold' : 'text-white'}`}>Descargo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="px-6 pt-6 pb-8">
              {tab === 'terms' ? (termsContent || genericTerms) : (waiverContent || genericWaiver)}

              <View className="flex-row gap-3 mt-6">
                <TouchableOpacity className="flex-1 bg-gray-200 rounded-lg py-4 items-center" onPress={onClose}>
                  <Text className="text-gray-800 font-semibold">Cerrar</Text>
                </TouchableOpacity>
                {onAccept ? (
                  <TouchableOpacity className="flex-1 bg-primary rounded-lg py-4 items-center" onPress={() => { onAccept && onAccept(); }}>
                    <Text className="text-white font-semibold">Acepto</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
