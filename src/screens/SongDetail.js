// @flow
import React, { useContext, useEffect, useState } from 'react';
import { withNavigation } from 'react-navigation';
import { View } from 'react-native';
import { Text, Icon, Badge } from 'native-base';
import KeepAwake from 'react-native-keep-awake';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger
} from 'react-native-popup-menu';
import { getChordsScale, getChordsDiff } from '../SongsProcessor';
import { NativeSongs, generatePDF } from '../util';
import { DataContext } from '../DataContext';
import I18n from '../translations';
import StackNavigatorOptions from '../navigation/StackNavigatorOptions';
import commonTheme from '../native-base-theme/variables/platform';
import SongViewFrame from './SongViewFrame';

const SongDetail = (props: any) => {
  const data = useContext(DataContext);
  const { keys } = data.settings;
  const { navigation } = props;
  const [transportNote, setTransportNote] = useState();

  var song = navigation.getParam('song');

  useEffect(() => {
    navigation.setParams({ transportNote, setTransportNote });
  }, [transportNote, setTransportNote]);

  useEffect(() => {
    if (keys.keepAwake) {
      KeepAwake.activate();
      return function() {
        KeepAwake.deactivate();
      };
    }
  }, []);

  return <SongViewFrame {...song} transportNote={transportNote} />;
};

const TransportNotesMenu = withNavigation((props: any) => {
  const { navigation } = props;
  const song = navigation.getParam('song');
  if (!song) {
    return null;
  }

  const chords = getChordsScale(I18n.locale);
  const transportNote = navigation.getParam('transportNote');
  const setTransportNote = navigation.getParam('setTransportNote');

  var menuOptionItems = chords.map((nota, i) => {
    if (transportNote === nota)
      var customStyles = {
        optionWrapper: {
          backgroundColor: commonTheme.brandPrimary,
          paddingHorizontal: 10,
          paddingVertical: 10
        },
        optionText: {
          color: 'white'
        }
      };
    return (
      <MenuOption
        key={i}
        value={nota}
        text={nota}
        customStyles={customStyles}
      />
    );
  });
  var trigger =
    transportNote === null || transportNote === undefined ? (
      <Icon
        name="musical-note"
        style={{
          marginTop: 4,
          marginRight: 8,
          width: 32,
          fontSize: 30,
          textAlign: 'center',
          color: StackNavigatorOptions.headerTitleStyle.color
        }}
      />
    ) : (
      <Badge style={{ marginTop: 6, marginRight: 6 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: 'bold',
            fontStyle: 'italic',
            textAlign: 'center',
            color: StackNavigatorOptions.headerTitleStyle.color
          }}>
          {transportNote}
        </Text>
      </Badge>
    );
  return (
    <Menu onSelect={value => setTransportNote(value)}>
      <MenuTrigger>{trigger}</MenuTrigger>
      <MenuOptions
        customStyles={{
          optionWrapper: { paddingHorizontal: 10, paddingVertical: 10 }
        }}>
        {transportNote != null && <MenuOption value={null} text="Original" />}
        {menuOptionItems}
      </MenuOptions>
    </Menu>
  );
});

const ViewPdf = withNavigation(props => {
  const { navigation } = props;
  const song = navigation.getParam('song');
  const transportToNote = navigation.getParam('transportNote');

  return (
    <Icon
      name="paper"
      style={{
        marginTop: 4,
        marginRight: 8,
        width: 32,
        fontSize: 30,
        textAlign: 'center',
        color: StackNavigatorOptions.headerTitleStyle.color
      }}
      onPress={() => {
        const { lines } = song;
        var diff = 0;
        if (transportToNote) {
          diff = getChordsDiff(lines[0], transportToNote, I18n.locale);
        }
        const itemsToRender = NativeSongs.getSongLinesForRender(
          lines,
          I18n.locale,
          diff
        );
        const item: SongToPdf = {
          canto: song,
          lines: itemsToRender
        };
        const opts: ExportToPdfOptions = {
          createIndex: false,
          pageNumbers: false,
          fileSuffix: ''
        };
        generatePDF([item], opts).then(path => {
          navigation.navigate('PDFViewer', {
            uri: path,
            title: song.titulo
          });
        });
      }}
    />
  );
});

SongDetail.navigationOptions = (props: any) => {
  const song = props.navigation.getParam('song');
  return {
    title: song ? song.titulo : 'Salmo',
    headerBackTitle: I18n.t('ui.back'),
    headerTruncatedBackTitle: I18n.t('ui.back'),
    headerRight: (
      <View style={{ flexDirection: 'row' }}>
        <ViewPdf />
        <TransportNotesMenu />
      </View>
    )
  };
};

export default SongDetail;
