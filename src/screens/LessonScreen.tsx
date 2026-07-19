import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Button, Card, Eyebrow } from '../components/ui';
import { LESSON_BY_CONCEPT } from '../data/lessons';
import { colors, fonts, fontSizes, radii, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

// ---------------------------------------------------------------------------
// Illustration image map — static require() calls so Metro can bundle them.
// ---------------------------------------------------------------------------
const ILLUSTRATIONS: Record<string, ReturnType<typeof require>> = {
  'linear-slope-triangle': require('../../assets/lessons/linear-slope-triangle.png'),
  'quadratics-parabola-roots-vertex': require('../../assets/lessons/quadratics-parabola-roots-vertex.png'),
  'ratios-percent-bar-model': require('../../assets/lessons/ratios-percent-bar-model.png'),
  'stats-bell-curve-sd': require('../../assets/lessons/stats-bell-curve-sd.png'),
  'geometry-pythagorean-squares': require('../../assets/lessons/geometry-pythagorean-squares.png'),
  'trig-soh-cah-toa-triangle': require('../../assets/lessons/trig-soh-cah-toa-triangle.png'),
  'grammar-subject-verb-bracket': require('../../assets/lessons/grammar-subject-verb-bracket.png'),
  'reading-context-clue-focus': require('../../assets/lessons/reading-context-clue-focus.png'),
};

// ---------------------------------------------------------------------------
// Inline formatting helpers
// Three patterns: ```code block```, **bold**, `inline code`
// ---------------------------------------------------------------------------

/** Renders a single run of text that may contain **bold** and `code` spans. */
function InlineText({ text, baseStyle }: { text: string; baseStyle?: object }) {
  const INLINE = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts: { type: 'plain' | 'bold' | 'code'; text: string }[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'plain', text: text.slice(last, match.index) });
    const token = match[0];
    if (token.startsWith('**')) parts.push({ type: 'bold', text: token.slice(2, -2) });
    else parts.push({ type: 'code', text: token.slice(1, -1) });
    last = match.index + token.length;
  }
  if (last < text.length) parts.push({ type: 'plain', text: text.slice(last) });

  return (
    <Text style={[styles.body, baseStyle]}>
      {parts.map((p, i) => {
        if (p.type === 'bold') return <Text key={i} style={styles.bold}>{p.text}</Text>;
        if (p.type === 'code') return <Text key={i} style={styles.inlineCode}>{p.text}</Text>;
        return <Text key={i}>{p.text}</Text>;
      })}
    </Text>
  );
}

/**
 * Splits on triple-backtick code blocks, rendering each segment as either
 * an InlineText paragraph or a monospace code block.
 */
function FormattedText({ text, baseStyle }: { text: string; baseStyle?: object }) {
  const CODE_BLOCK = /```([\s\S]*?)```/g;
  const parts: { type: 'inline' | 'block'; text: string }[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = CODE_BLOCK.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'inline', text: text.slice(last, match.index) });
    parts.push({ type: 'block', text: match[1].trim() });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: 'inline', text: text.slice(last) });

  return (
    <View style={styles.formattedRoot}>
      {parts.map((p, i) =>
        p.type === 'block' ? (
          <View key={i} style={styles.codeBlock}>
            <Text style={styles.codeBlockText}>{p.text}</Text>
          </View>
        ) : (
          // Split on paragraph breaks (\n\n) to give each paragraph its own Text node
          p.text
            .split('\n\n')
            .filter((seg) => seg.trim().length > 0)
            .map((seg, j) => <InlineText key={`${i}-${j}`} text={seg.trim()} baseStyle={baseStyle} />)
        ),
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LessonScreen({ navigation, route }: Props) {
  const { concept } = route.params;
  const lesson = LESSON_BY_CONCEPT[concept];

  if (!lesson) {
    return (
      <View style={styles.screen}>
        <Text style={styles.body}>Lesson not found.</Text>
      </View>
    );
  }

  const illustrationSrc = ILLUSTRATIONS[lesson.illustration.id];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Back link */}
      <Button title="← Back" variant="ghost" onPress={() => navigation.goBack()} />

      {/* Title */}
      <Text style={styles.title}>{lesson.title}</Text>

      {/* Illustration */}
      {illustrationSrc && (
        <View style={styles.illustrationWrap}>
          <Image
            source={illustrationSrc}
            style={styles.illustration}
            resizeMode="cover"
            accessibilityLabel={lesson.illustration.altText}
          />
        </View>
      )}

      {/* Sections */}
      {lesson.sections.map((section, i) => (
        <View key={i}>
          <Text style={styles.sectionHeading}>{section.heading}</Text>
          <FormattedText text={section.body} />

          {section.example && (
            <Card style={styles.exampleCard}>
              <Eyebrow>Worked example</Eyebrow>
              <View style={styles.problemBox}>
                <InlineText text={section.example.problem} baseStyle={styles.problemText} />
              </View>
              <FormattedText text={section.example.solution} baseStyle={styles.solutionText} />
            </Card>
          )}
        </View>
      ))}

      {/* Practice CTA */}
      <Card style={styles.practiceCard}>
        <Text style={styles.practiceLabel}>Ready to try some questions?</Text>
        <Button
          title={`Practice ${lesson.title} ⚡`}
          variant="primary"
          onPress={() => navigation.navigate('Session', { focusConcept: concept })}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  illustrationWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    backgroundColor: colors.panel,
  },
  illustration: {
    width: '100%',
    aspectRatio: 3 / 2,
  },
  sectionHeading: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md + 1,
    color: colors.mint,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  formattedRoot: {
    gap: spacing.sm,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.muted,
    lineHeight: 24,
  },
  bold: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  inlineCode: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm + 1,
    color: colors.zap,
    backgroundColor: 'rgba(255,210,63,0.10)',
  },
  codeBlock: {
    backgroundColor: colors.panel2,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  codeBlockText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: 22,
  },
  exampleCard: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderColor: colors.zap,
    borderWidth: 1,
    backgroundColor: 'rgba(255,210,63,0.04)',
  },
  problemBox: {
    borderLeftWidth: 3,
    borderLeftColor: colors.zap,
    paddingLeft: spacing.md,
    marginBottom: spacing.md,
  },
  problemText: {
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  solutionText: {
    color: colors.muted,
  },
  practiceCard: {
    marginTop: spacing.xl,
  },
  practiceLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
});
