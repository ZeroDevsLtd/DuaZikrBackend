# 🎨 Ionicons Guide for Dua & Zikr App Ads

## 📱 **App Features & Premium**
- `star` - Premium features, upgrades, favorites
- `diamond` - Premium/VIP features
- `trophy` - Achievements, rewards
- `shield-checkmark` - Security, protection
- `settings` - App settings, configuration
- `person` - User profile, account
- `heart` - Favorites, likes, love
- `bookmark` - Save, bookmark content

## 🔔 **Notifications & Reminders**
- `notifications` - General notifications
- `notifications-off` - Disable notifications
- `alarm` - Prayer time alarms
- `time` - Timers, schedules
- `calendar` - Calendar, dates, events
- `clock` - Time-related features

## 📚 **Islamic & Spiritual**
- `moon` - Prayer times, Islamic calendar
- `sunny` - Daily duas, morning/evening
- `leaf` - Growth, spiritual development
- `water` - Purification, wudu
- `flame` - Spirituality, passion
- `rose` - Beauty, blessings
- `seedling` - New beginnings, growth
- `tree` - Family tree, lineage

## 🔗 **Social & Sharing**
- `share-social` - Share app, content
- `people` - Community, groups
- `chatbubble` - Chat, discussions
- `mail` - Contact, support
- `call` - Phone support
- `location` - Location-based features
- `globe` - Worldwide access

## 📊 **Progress & Analytics**
- `trending-up` - Progress, growth
- `analytics` - Statistics, insights
- `bar-chart` - Charts, data
- `pie-chart` - Progress visualization
- `stats-chart` - Performance metrics

## 💳 **Business & Features**
- `card` - Payment, subscription
- `gift` - Rewards, bonuses
- `wallet` - Financial features
- `bag` - Shopping, store
- `cart` - Purchase, checkout

## 🎯 **Actions & Navigation**
- `arrow-forward` - Next, continue
- `arrow-up` - Increase, improve
- `checkmark` - Success, completion
- `add` - Add new, create
- `search` - Search functionality
- `filter` - Filter options
- `options` - More options

## 🌟 **Special & Unique**
- `sparkles` - Special features
- `rainbow` - Diversity, inclusion
- `sunny` - Bright, positive
- `cloud` - Cloud features, sync
- `wifi` - Online features
- `cellular` - Mobile features

## 🎨 **Color Guidelines**

### **Primary Colors**
- `#2c5530` - Islamic Green (Primary)
- `#28a745` - Success Green
- `#007bff` - Blue (Information)
- `#6f42c1` - Purple (Premium)

### **Secondary Colors**
- `#fd7e14` - Orange (Warning)
- `#17a2b8` - Teal (Info)
- `#20c997` - Mint (Success)
- `#e83e8c` - Pink (Community)

### **Text Colors**
- `#495057` - Dark Gray (Primary text)
- `#6c757d` - Medium Gray (Secondary text)
- `#212529` - Very Dark (Headers)

## 📝 **Usage Examples**

### **Premium Features**
```json
{
  "iconName": "star",
  "iconColor": "#2c5530",
  "titleColor": "#2c5530",
  "actionColor": "#2c5530"
}
```

### **Daily Reminders**
```json
{
  "iconName": "notifications",
  "iconColor": "#28a745",
  "titleColor": "#28a745",
  "actionColor": "#28a745"
}
```

### **Community Features**
```json
{
  "iconName": "people",
  "iconColor": "#e83e8c",
  "titleColor": "#e83e8c",
  "actionColor": "#e83e8c"
}
```

### **Progress Tracking**
```json
{
  "iconName": "trending-up",
  "iconColor": "#20c997",
  "titleColor": "#20c997",
  "actionColor": "#20c997"
}
```

## 🔧 **Implementation Tips**

1. **Consistency**: Use the same color for icon, title, and action button
2. **Contrast**: Ensure text colors provide good readability
3. **Priority**: Use higher priority numbers for more important ads
4. **Active State**: Only show ads with `isActive: true`
5. **Icon Selection**: Choose icons that clearly represent the feature

## 📱 **Mobile App Integration**

### **React Native with Ionicons**
```javascript
import Icon from 'react-native-vector-icons/Ionicons';

<Icon 
  name={ad.iconName} 
  size={24} 
  color={ad.iconColor} 
/>
```

### **Flutter with Ionicons**
```dart
import 'package:ionicons/ionicons.dart';

Icon(
  Ionicons.getIconData(ad.iconName),
  color: Color(int.parse(ad.iconColor.replaceAll('#', '0xFF'))),
  size: 24,
)
```

### **Native iOS/Android**
```swift
// iOS
let iconName = ad.iconName
let iconColor = UIColor(hex: ad.iconColor)

// Android
String iconName = ad.iconName
int iconColor = Color.parseColor(ad.iconColor)
```

---

**🎨 This guide helps you choose the perfect icons for your ads while maintaining consistency and visual appeal!**
