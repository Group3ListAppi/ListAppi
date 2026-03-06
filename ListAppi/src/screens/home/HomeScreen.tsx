// src/screens/home/HomeScreen.tsx
import React from 'react';
import { View } from 'react-native';
import { Text, Card, Title, Paragraph } from 'react-native-paper';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';

export const HomeScreen = () => {
  return (
    <ScreenWrapper>
      <View style={{ padding: 16 }}>
        <Title>Tervetuloa!</Title>
        <Paragraph>Tässä on tämän päivän suositukset.</Paragraph>
        
        <Card style={{ marginTop: 16 }}>
          <Card.Cover source={{ uri: 'https://picsum.photos/700' }} />
          <Card.Content>
            <Title>Päivän resepti</Title>
            <Paragraph>Herkullista kotiruokaa helposti.</Paragraph>
          </Card.Content>
        </Card>
      </View>
    </ScreenWrapper>
  );
};