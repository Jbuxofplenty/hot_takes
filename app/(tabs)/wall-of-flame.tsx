import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export default function WallOfFlameScreen() {
  const { colors } = useTheme();

  // Mock data for hot takes feed
  const hotTakes = [
    {
      id: 1,
      text: "Celebrities don't lead culture anymore—TikTok teens with Wi-Fi and daddy issues do.",
      votes: 0,
    },
    {
      id: 2,
      text: "The news is just entertainment for people who think they're too smart for entertainment.",
      votes: 0,
    },
    {
      id: 3,
      text: "Hollywood doesn't make stars now—it manufactures trauma with good lighting and better PR.",
      votes: 0,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.BLACK }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.ERROR }]}>Wall of Flame</Text>
          <Text style={[styles.headerSubtitle, { color: colors.TEXT }]}>Hot Takes</Text>
        </View>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="home-outline" size={moderateScale(28)} color={colors.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {hotTakes.map((take) => (
          <View
            key={take.id}
            style={[styles.takeCard, { borderBottomColor: colors.BLACK }]}
          >
            <Text style={[styles.takeText, { color: colors.TEXT }]}>{take.text}</Text>
            
            {/* Vote Slider */}
            <View style={styles.voteContainer}>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderThumb, { backgroundColor: colors.BLACK }]} />
              </View>
              <TouchableOpacity style={styles.upvoteButton}>
                <Text style={{ fontSize: moderateScale(24) }}>⬆️</Text>
              </TouchableOpacity>
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
  notificationIcon: {
    padding: scale(8),
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
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  sliderTrack: {
    flex: 1,
    height: verticalScale(4),
    backgroundColor: '#DDD',
    borderRadius: scale(2),
    position: 'relative',
  },
  sliderThumb: {
    width: scale(32),
    height: verticalScale(32),
    borderRadius: scale(16),
    position: 'absolute',
    top: -verticalScale(14),
    left: 0,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  upvoteButton: {
    padding: scale(8),
  },
});

