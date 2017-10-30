import React from 'react';
import { StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { Tab, Tabs, ScrollableTab } from 'native-base';
import BaseModal from './BaseModal';
import SalmoList from './SalmoList';
import { addSalmoToList, closeChooserDialog } from '../actions';
import search from '../search';

const styles = StyleSheet.create({
  tabs: { fontSize: 14 }
});

const SalmoChooserDialog = props => {
  var items = props.tabs.map((v, i) => {
    return (
      <Tab
        key={i}
        heading={v.chooser.toUpperCase()}
        textStyle={styles.tabs}
        activeTextStyle={styles.tabs}>
        <SalmoList
          filter={v.params.filter}
          onPress={salmo =>
            props.salmoSelected(salmo, props.listName, props.listKey)}
        />
      </Tab>
    );
  });
  return (
    <BaseModal
      visible={props.visible}
      closeModal={() => props.close()}
      title="Buscar Canto"
      fade={true}>
      <Tabs initialPage={0} renderTabBar={() => <ScrollableTab />}>
        {items}
      </Tabs>
    </BaseModal>
  );
};

const mapStateToProps = state => {
  var chooser = state.ui.get('chooser');
  var chooser_target_list = state.ui.get('chooser_target_list');
  var chooser_target_key = state.ui.get('chooser_target_key');
  var tabs = search.filter(x => x.chooser != undefined);
  return {
    listName: chooser_target_list,
    listKey: chooser_target_key,
    visible: chooser === 'Salmo',
    tabs: tabs
  };
};

const mapDispatchToProps = dispatch => {
  return {
    close: () => {
      dispatch(closeChooserDialog());
    },
    salmoSelected: (salmo, list, key) => {
      dispatch(addSalmoToList(salmo, list, key));
      dispatch(closeChooserDialog());
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SalmoChooserDialog);