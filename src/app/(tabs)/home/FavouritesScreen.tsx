import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useTheme } from '@/hooks/useTheme'
import { Theme, FONT_SIZE, FONT_FAMILY } from '@/constants/theme'

const FavouritesScreen = () => {
  const theme = useTheme()
  const styles = makeStyles(theme)

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Favourites Screen</Text>
    </View>
  )
}

export default FavouritesScreen

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    text: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
    },
  });