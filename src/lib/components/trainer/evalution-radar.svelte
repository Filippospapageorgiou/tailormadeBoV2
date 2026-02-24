<script lang="ts">
  import { LineChart } from "layerchart";
  import { curveLinearClosed } from "d3-shape";
  import { scaleBand } from "d3-scale";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import ActivityIcon from "@lucide/svelte/icons/activity";
  import { getEvaluationSectionsContext } from '$lib/stores/evaluationSections.svelte';
  import { getEquipmentEvalContext } from '$lib/stores/equipment-eval.svelte';
  import type { EvaluationSummaryActions } from '$lib/models/trainers.types';

  let { evalFinal }: { evalFinal?: EvaluationSummaryActions } = $props();

  const sectionsStore = getEvaluationSectionsContext();
  const equipmentStore = getEquipmentEvalContext();

  // Normalize a raw score to 0–100 based on (itemCount × max 5 per item)
  function normalize(score: number, itemCount: number): number {
    const max = itemCount * 5;
    return max > 0 ? Math.round((score / max) * 100) : 0;
  }

  const chartData = $derived.by(() => {
    const groups = sectionsStore.groupedSections;
    const cleanGroup   = groups.find(g => g.section === 'cleanliness');
    const knowledgeGroup = groups.find(g => g.section === 'knowledge');
    const trainingGroup  = groups.find(g => g.section === 'training');

    return [
      {
        category: 'Καθαριότητα',
        score: normalize(cleanGroup?.totalScore ?? 0, cleanGroup?.items.length ?? 0)
      },
      {
        category: 'Γνώσεις',
        score: normalize(knowledgeGroup?.totalScore ?? 0, knowledgeGroup?.items.length ?? 0)
      },
      {
        category: 'Εκπαίδευση',
        score: normalize(trainingGroup?.totalScore ?? 0, trainingGroup?.items.length ?? 0)
      },
      {
        category: 'Εξοπλισμός',
        score: equipmentStore.totalEquipments > 0
          ? Math.round((equipmentStore.averageScore / 5) * 100)
          : 0
      },
      {
        category: 'Τελικό',
        score: evalFinal?.score ?? 0
      },
    ];
  });

  const overallScore = $derived(
    Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length)
  );

  const overallColor = $derived.by(() => {
    const s = evalFinal?.score ?? 0;
    return s >= 80 ? 'text-emerald-500' : s >= 60 ? 'text-amber-500' : 'text-red-500';
  });

  const chartConfig = {
    score: { label: "Score %", color: "var(--chart-1)" },
  } satisfies Chart.ChartConfig;
</script>

<Card.Root class="flex flex-col">
  <Card.Header class="pb-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="rounded-lg bg-primary/10 p-2">
          <ActivityIcon class="h-4 w-4 text-primary" />
        </div>
        <div>
          <Card.Title class="text-base font-semibold tracking-tight">
            Επισκόπηση Αξιολόγησης
          </Card.Title>
          <Card.Description class="text-xs">
            Σκορ ανά κατηγορία σε πραγματικό χρόνο · % του μέγιστου δυνατού
          </Card.Description>
        </div>
      </div>
      <div class="flex flex-col items-end gap-0.5">
        <span class="text-2xl font-bold tabular-nums {overallColor}">{evalFinal?.score ?? 0}%</span>
        <span class="text-[10px] text-muted-foreground">Τελικό Score</span>
        <span class="text-[10px] text-muted-foreground/50">μ.ο. κατηγοριών {overallScore}%</span>
      </div>
    </div>
  </Card.Header>

  <Card.Content class="flex-1 pt-0">
    <Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-[380px]">
      <LineChart
        data={chartData}
        series={[
          {
            key: "score",
            label: "Score %",
            color: chartConfig.score.color,
          },
        ]}
        radial
        x="category"
        xScale={scaleBand()}
        points={{ r: 5 }}
        padding={18}
        props={{
          spline: {
            curve: curveLinearClosed,
            fill: "var(--color-score)",
            fillOpacity: 0.2,
            stroke: "0",
            motion: "tween",
          },
          xAxis: {
            tickLength: 0,
          },
          yAxis: {
            format: () => "",
          },
          grid: {
            radialY: "linear",
          },
          tooltip: {
            context: {
              mode: "voronoi",
            },
          },
          highlight: {
            lines: false,
            points: false,
          },
        }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip>
            {#snippet formatter({ value, name })}
              <div class="flex w-full items-center justify-between gap-4">
                <span class="text-muted-foreground">{name}</span>
                <span class="font-mono font-semibold tabular-nums">{value}%</span>
              </div>
            {/snippet}
          </Chart.Tooltip>
        {/snippet}
      </LineChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
