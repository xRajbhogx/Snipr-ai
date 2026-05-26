import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useTheme } from '@/hooks/useTheme'
import { Theme, FONT_SIZE, FONT_FAMILY } from '@/constants/theme'

const SnippetDetailScreen = () => {
  const theme = useTheme()
  const styles = makeStyles(theme)

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Snippet Detail Screen</Text>
    </View>
  )
}

export default SnippetDetailScreen

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