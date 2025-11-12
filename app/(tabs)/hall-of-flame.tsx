import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export default function HallOfFlameScreen() {
  const { colors } = useTheme();

  // Mock data for top hot takes
  const topTakes = [
    {
      id: 1,
      text: "The crowd became the critic, and truth became whatever echoed the loudest.",
      author: "HotDog456",
      heatScore: 86,
    },
    {
      id: 2,
      text: "The algorithm knows us better than our ancestors ever could and loves us far less.",
      author: "BobSmith823",
      heatScore: 68,
    },
    {
      id: 3,
      text: "We stopped seeking wisdom now we just collect opinions that flatter us.",
      author: "WandaBreed23",
      heatScore: 54,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.BLACK }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.ERROR }]}>Hall of Flame</Text>
          <Text style={[styles.headerSubtitle, { color: colors.TEXT }]}>Hot Takes</Text>
        </View>
        <Ionicons name="thermometer-outline" size={moderateScale(28)} color={colors.PRIMARY} />
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={[styles.subtitle, { color: colors.TEXT }]}>
          LAST WEEK&apos;S HOTTEST TAKES
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {topTakes.map((take) => (
          <View
            key={take.id}
            style={[styles.takeCard, { borderBottomColor: colors.BLACK }]}
          >
            <Text style={[styles.takeText, { color: colors.TEXT }]}>{take.text}</Text>
            
            <View style={styles.footer}>
              <Text style={[styles.author, { color: colors.TEXT_SECONDARY }]}>
                Submitted by {take.author}
              </Text>
              <View style={styles.scoreContainer}>
                <Text style={[styles.scoreLabel, { color: colors.TEXT }]}>HEAT SCORE</Text>
                <Text style={[styles.scoreValue, { color: colors.TEXT }]}>
                  {take.heatScore}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 2,
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  subtitleContainer: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
  },
  subtitle: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  takeCard: {
    padding: scale(20),
    borderBottomWidth: 1,
  },
  takeText: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    marginBottom: verticalScale(16),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: moderateScale(12),
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
  },
});

