"use strict";

      // ============================================================
      // DATA
      // ============================================================
      const PATTERNS_DEFAULT = [
        "Gap & Go",
        "Premarket High Break",
        "VWAP Reclaim",
        "First Pullback",
        "Opening Range Break",
        "Daily Breakout",
        "Multi-Day Breakout",
        "Dip Buy",
        "LOD Reversal",
        "Short Breakdown",
        "Parabolic Short",
        "Failed Breakout Short",
      ];

      const PLAYBOOK_DEFAULT = {
        "Gap & Go": {
          setup: [
            "Gap ≥10% on binary catalyst (FDA, earnings, M&A)",
            "Relative volume >10x pre-open",
            "Float <10M shares preferred",
            "Clean level to break (PM high or prior day HOD)",
            "No significant overhead resistance within 15%",
          ],
          entry:
            "Break of premarket high with volume surge ≥2× avg. First 30 minutes only. Enter on candle close above PM high or live on breakout tick. Stop below PM high. Partial at +15%, +25%. Runner to measured move.",
          failures: [
            "Gap-and-crap: opens strong, immediately reverses on no follow-through",
            "PM high break fails within 5 minutes — indicates trapped buyers above",
            "Rel vol fades after open: move runs out of fuel early",
            'News is old or already priced in — watch for "sell the news" action',
          ],
        },
        "Premarket High Break": {
          setup: [
            "Stock consolidating just below PM high for ≥15 min",
            "Catalyst present (can be same-day or recent)",
            "Relative volume >8x",
            "Float <15M preferred",
            "Volume building as price compresses at PM high level",
          ],
          entry:
            "Buy break above PM high. Confirm with a ≥2× volume bar. Stop: below PM high (tight) or below consolidation base. Target: measured move based on PM range. Take partials at 1:1, let runner go.",
          failures: [
            "False break: spikes above PM high then immediately reverses",
            "Lack of buyers above PM high — stock stalls and fades",
            "Market-wide weakness overrides the setup",
            "PM high was set on abnormally thin pre-market liquidity",
          ],
        },
        "VWAP Reclaim": {
          setup: [
            "Stock dipped below VWAP then shows signs of reclaiming",
            "Catalyst present or strong momentum name",
            "Relative volume >5x at time of reclaim",
            "Must reclaim VWAP on increasing volume",
            "First 2 hours of session preferred",
          ],
          entry:
            "Buy on close above VWAP on ≥2× volume. Stop: back below VWAP. Target: prior HOD or key resistance. Multiple VWAP tests without holding = weakness, skip. Best in first 2 hours.",
          failures: [
            "Multiple failed VWAP reclaims signal distribution",
            "Low volume reclaim: no conviction, likely to fail",
            "Broader market weakness pulls stock back through VWAP",
            "Stock stays below VWAP all day — trend is down",
          ],
        },
        "First Pullback": {
          setup: [
            "After an initial spike (≥20%), first orderly pullback begins",
            "Catalyst is still fresh and relevant",
            "Relative volume remains >5x during pullback",
            "Pullback to VWAP, 9 EMA, or a clean support level",
            "No break of the first major support level",
          ],
          entry:
            "Enter on first green candle confirmation off pullback low. Stop: below pullback low. Target: prior HOD and new highs. This is the highest-probability long entry in small caps after a news spike.",
          failures: [
            "Spike fails to reclaim VWAP — indicates weak tape",
            "Pullback goes too deep: loses 50%+ of initial spike range",
            "Volume dries up on bounce — no buyers returning",
            'Pattern becomes a "dead cat" if news deteriorates',
          ],
        },
        "Opening Range Break": {
          setup: [
            "Clear 5–15 minute opening range established",
            "Catalyst or strong theme driving the stock",
            "Relative volume >8x",
            "Float <20M preferred",
            "Price compresses at range boundary before break",
          ],
          entry:
            "Buy break above ORH (opening range high) or short break below ORL on ≥2× volume. Stop: opposite side of opening range. Target: 1:1 to 2:1 risk/reward minimum. Works best 9:45–10:30 AM.",
          failures: [
            "Headfake break: ORB triggers then immediately reverses (whipsaw)",
            "Low volume break: no institutional participation",
            "Too wide an opening range — risk becomes too large",
            "Multiple tests of range boundary before break dilute the setup",
          ],
        },
        "Daily Breakout": {
          setup: [
            "Breaking through key daily chart resistance with volume",
            "Catalyst preferred (earnings, news) or strong sector theme",
            "Relative volume >3× daily average",
            "Pattern: multi-week consolidation at resistance level",
            "Volume expansion on breakout day",
          ],
          entry:
            "Buy break and close above resistance. Stop: below resistance (now support). Target: measured move from consolidation pattern. Must see volume confirmation. Best on first test after a clean base.",
          failures: [
            "Volume dry-up on breakout: no conviction, likely to fail back",
            "Resistance level becomes a ceiling again (false break)",
            "Broad market sell-off invalidates breakout",
            "Too many prior tests of resistance weaken the eventual break",
          ],
        },
        "Multi-Day Breakout": {
          setup: [
            "3–10 days of tight consolidation at resistance",
            "Relative volume building over the consolidation period",
            "Catalyst preferred to trigger the break",
            "Float <30M preferred for small cap version",
            "Volume ≥2× average on breakout day",
          ],
          entry:
            "Buy break above the consolidation high. Aggressive: buy as it breaks. Conservative: buy the first pullback to the breakout level. Stop: below consolidation low. Target: 2:1 or prior major resistance.",
          failures: [
            "Consolidation was actually distribution — stock breaks down instead",
            "Breakout happens on low volume — weak hands, likely to fail",
            "Move is exhaustive: stock breaks out then immediately stalls",
            "News catalyst fades: stock returns to consolidation range",
          ],
        },
        "Dip Buy": {
          setup: [
            "Strong catalyst name pulling back to key intraday support",
            "Support level is clean and well-defined (VWAP, prior HOD, round number)",
            "Relative volume remains elevated (>5×)",
            "No signs of trend reversal — just a normal pullback",
            "Broader market is supportive",
          ],
          entry:
            "Buy at support with a volume spike on the bounce candle. Stop: below support level. Target: prior HOD or extended target. Risk should be ≤0.5% of account. Only on high-conviction catalyst names.",
          failures: [
            "Support breaks: dip buy becomes a breakdown trade",
            "Catalyst fades: no reason for buyers to step in at support",
            "Dip is part of a larger reversal pattern (lower highs forming)",
            "Market weakness drags the stock through support",
          ],
        },
        "LOD Reversal": {
          setup: [
            "Stock at or near its low of the day",
            "Showing extreme oversold signals (RSI <20 intraday)",
            "Potential positive catalyst emerging (or short-term exhaustion)",
            "Volume spike on the selloff — potential capitulation",
            "Level of significance at LOD (prior support, round number)",
          ],
          entry:
            "Long after first green candle off LOD with volume. Stop: below LOD. Target: VWAP or half-recovery of the day's range. High risk, requires tight stop. Only take if risk:reward is ≥3:1.",
          failures: [
            "Stock continues lower — no capitulation, trend continues",
            "Dead cat: brief bounce then continues the downtrend",
            "No catalyst to reverse: pure technical play often fails in small caps",
            "Broad market weakness continues to press the stock",
          ],
        },
        "Short Breakdown": {
          setup: [
            "Breaking below key support with volume",
            "Weak price action all morning (lower highs, lower lows)",
            "High relative volume (panic selling or distribution)",
            "Float size flexible — works on any float",
            "No imminent catalyst that could reverse the move",
          ],
          entry:
            "Short break below support on ≥2× volume. Stop: above support (now resistance). Target: next support level or measured move down. Avoid shorting into climactic volume (risk of bounce).",
          failures: [
            "Short squeeze: trapped shorts create buying pressure",
            "Support level holds: false breakdown",
            "Positive news emerges unexpectedly while short",
            "SEC halt risk if stock moving on unusual activity",
          ],
        },
        "Parabolic Short": {
          setup: [
            "Stock up ≥200% with no or old news",
            "Dramatically extended from VWAP (>50% above)",
            "High relative volume (>15×) but momentum fading",
            "Days-in-a-row move with diminishing daily gains",
            "Short interest likely already elevated from prior day",
          ],
          entry:
            "Short first red candle after clear intraday high. Stop: above intraday high (or recent 5-min high). Target: VWAP (often 30–50% drop from peak). Size down — can be volatile. Must be patient for the red candle signal.",
          failures: [
            "Stock continues parabolic: short squeeze risk is extreme",
            "No red candle signal — momentum relentless (wait it out)",
            "Halt risk: SEC can halt stocks moving too fast",
            "News catalyst legitimizes the move — cover immediately",
          ],
        },
        "Failed Breakout Short": {
          setup: [
            "Breakout attempt that clearly reverses on high volume",
            "Stock trapped above the breakout level with sellers in control",
            "Relative volume elevated (>5×) on the reversal",
            "Lower high forming after the failed break",
            "Prior resistance re-asserting itself strongly",
          ],
          entry:
            "Short break back below the breakout level on volume. Stop: above the recent failed high. Target: prior support or base of the original pattern. High win rate with proper confirmation.",
          failures: [
            "Breakout resumes: stop out triggers, trade reverses",
            "Low volume failed break: move not exhausted, can try again",
            "Pattern resets: stock consolidates instead of breaking down",
            "Market bid comes in and rescues longs above breakout level",
          ],
        },
      };

      const DUMMY_TRADES = [
        {
          id: "d01",
          date: "2026-04-07",
          ticker: "RGTI",
          pattern: "Gap & Go",
          direction: "Long",
          entryPrice: 3.42,
          exitPrice: 4.1,
          shares: 500,
          pnl: 340.0,
          catalyst: true,
          catalystType: "Earnings Beat",
          relVol: 18.4,
          float: 2.1,
          premarketHigh: 3.95,
          gapPct: 22.5,
          entryGrade: "A",
          exitGrade: "B",
          followedRules: true,
          emotionalState: "Calm",
          sizedCorrectly: true,
          writeUp:
            "Clean gap on earnings beat. Entered on break of PM high with tight stop. Took partials at +15%. Let runner go but exited before noon. Best execution of the week.",
          isBestOp: true,
        },
        {
          id: "d02",
          date: "2026-04-07",
          ticker: "FFIE",
          pattern: "Parabolic Short",
          direction: "Short",
          entryPrice: 2.85,
          exitPrice: 2.28,
          shares: 1000,
          pnl: 570.0,
          catalyst: false,
          catalystType: "",
          relVol: 25.2,
          float: 5.8,
          premarketHigh: 2.6,
          gapPct: 8.4,
          entryGrade: "A",
          exitGrade: "A",
          followedRules: true,
          emotionalState: "Calm",
          sizedCorrectly: true,
          writeUp:
            "Perfect parabolic short. Stock was up 200% in 3 days with no news. Waited for first red candle off intraday high. Covered in stages. Textbook execution.",
          isBestOp: false,
        },
        {
          id: "d03",
          date: "2026-04-09",
          ticker: "SOUN",
          pattern: "VWAP Reclaim",
          direction: "Long",
          entryPrice: 7.12,
          exitPrice: 6.84,
          shares: 300,
          pnl: -84.0,
          catalyst: true,
          catalystType: "Partnership Announce",
          relVol: 6.8,
          float: 12.4,
          premarketHigh: 7.35,
          gapPct: 5.2,
          entryGrade: "B",
          exitGrade: "A",
          followedRules: false,
          emotionalState: "Slightly Anxious",
          sizedCorrectly: true,
          writeUp:
            "Tried VWAP reclaim but setup was weak. Too much overhead resistance. Should have waited for cleaner reclaim with volume confirmation. Got anxious and entered early.",
          isBestOp: false,
        },
        {
          id: "d04",
          date: "2026-04-09",
          ticker: "MULN",
          pattern: "Opening Range Break",
          direction: "Long",
          entryPrice: 1.45,
          exitPrice: 1.27,
          shares: 2000,
          pnl: -360.0,
          catalyst: false,
          catalystType: "",
          relVol: 3.2,
          float: 45.6,
          premarketHigh: 1.52,
          gapPct: 2.1,
          entryGrade: "C",
          exitGrade: "B",
          followedRules: false,
          emotionalState: "Reactive",
          sizedCorrectly: false,
          writeUp:
            "Bad trade. No catalyst, high float, low rel vol. Chased the ORB. Oversized. Should not have taken this. Classic revenge trade after SOUN loss.",
          isBestOp: false,
        },
        {
          id: "d05",
          date: "2026-04-10",
          ticker: "NVAX",
          pattern: "First Pullback",
          direction: "Long",
          entryPrice: 8.34,
          exitPrice: 9.55,
          shares: 400,
          pnl: 484.0,
          catalyst: true,
          catalystType: "FDA Advisory",
          relVol: 14.7,
          float: 6.2,
          premarketHigh: 8.8,
          gapPct: 15.3,
          entryGrade: "A",
          exitGrade: "B",
          followedRules: true,
          emotionalState: "Calm",
          sizedCorrectly: true,
          writeUp:
            "Textbook first pullback on FDA news. Gapped strong, 10-min base then broke. Entered on pullback to VWAP. Good patience today — waited for the right moment.",
          isBestOp: true,
        },
        {
          id: "d06",
          date: "2026-04-14",
          ticker: "BBAI",
          pattern: "Opening Range Break",
          direction: "Long",
          entryPrice: 4.22,
          exitPrice: 4.88,
          shares: 600,
          pnl: 396.0,
          catalyst: true,
          catalystType: "Contract Win",
          relVol: 11.3,
          float: 8.9,
          premarketHigh: 4.15,
          gapPct: 12.7,
          entryGrade: "B",
          exitGrade: "B",
          followedRules: true,
          emotionalState: "Calm",
          sizedCorrectly: true,
          writeUp:
            "ORB worked well. Clean 5-min range, broke above with volume surge. Slightly late entry but still caught most of the move.",
          isBestOp: false,
        },
        {
          id: "d07",
          date: "2026-04-14",
          ticker: "MARA",
          pattern: "Daily Breakout",
          direction: "Long",
          entryPrice: 18.45,
          exitPrice: 17.9,
          shares: 200,
          pnl: -110.0,
          catalyst: false,
          catalystType: "",
          relVol: 2.8,
          float: 82.0,
          premarketHigh: 18.2,
          gapPct: 1.5,
          entryGrade: "C",
          exitGrade: "A",
          followedRules: false,
          emotionalState: "Slightly Anxious",
          sizedCorrectly: true,
          writeUp:
            "Daily breakout with no catalyst and very low rel vol. No energy. Classic trap. At least cut it quickly — that is one positive.",
          isBestOp: false,
        },
        {
          id: "d08",
          date: "2026-04-16",
          ticker: "SPRC",
          pattern: "Short Breakdown",
          direction: "Short",
          entryPrice: 3.65,
          exitPrice: 3.22,
          shares: 700,
          pnl: 301.0,
          catalyst: false,
          catalystType: "",
          relVol: 9.6,
          float: 4.1,
          premarketHigh: 3.8,
          gapPct: -5.3,
          entryGrade: "A",
          exitGrade: "A",
          followedRules: true,
          emotionalState: "Calm",
          sizedCorrectly: true,
          writeUp:
            "Clean short breakdown. Weak all morning. Broke below 3.45 key support with high relative volume. Covered at target. Followed the plan exactly.",
          isBestOp: false,
        },
        {
          id: "d09",
          date: "2026-04-21",
          ticker: "ACHR",
          pattern: "Premarket High Break",
          direction: "Long",
          entryPrice: 5.18,
          exitPrice: 6.02,
          shares: 500,
          pnl: 420.0,
          catalyst: true,
          catalystType: "DOT Certification",
          relVol: 16.8,
          float: 7.3,
          premarketHigh: 5.1,
          gapPct: 18.9,
          entryGrade: "A",
          exitGrade: "A",
          followedRules: true,
          emotionalState: "Calm",
          sizedCorrectly: true,
          writeUp:
            "Perfect premarket high break. Stock consolidated at PM high for 20 minutes. Broke with massive volume. Best execution this month — patient and precise.",
          isBestOp: true,
        },
        {
          id: "d10",
          date: "2026-04-22",
          ticker: "TSLA",
          pattern: "Failed Breakout Short",
          direction: "Short",
          entryPrice: 242.3,
          exitPrice: 248.15,
          shares: 50,
          pnl: -292.5,
          catalyst: false,
          catalystType: "",
          relVol: 1.8,
          float: 3200.0,
          premarketHigh: 240.5,
          gapPct: 0.8,
          entryGrade: "C",
          exitGrade: "B",
          followedRules: false,
          emotionalState: "Reactive",
          sizedCorrectly: false,
          writeUp:
            "Should not have shorted TSLA. Too large a float — not a small cap setup. Chased a failed breakout that resumed. Big lesson: stick to the small cap universe.",
          isBestOp: false,
        },
        {
          id: "d11",
          date: "2026-04-23",
          ticker: "POET",
          pattern: "Multi-Day Breakout",
          direction: "Long",
          entryPrice: 6.45,
          exitPrice: 7.88,
          shares: 400,
          pnl: 572.0,
          catalyst: true,
          catalystType: "Product Launch",
          relVol: 22.1,
          float: 3.5,
          premarketHigh: 6.55,
          gapPct: 8.9,
          entryGrade: "A",
          exitGrade: "B",
          followedRules: true,
          emotionalState: "Calm",
          sizedCorrectly: true,
          writeUp:
            "Multi-day breakout on product launch news. 3 days of consolidation at resistance. Clean break with strong volume. Took partials at +10% and +20%.",
          isBestOp: false,
        },
        {
          id: "d12",
          date: "2026-04-24",
          ticker: "HIMS",
          pattern: "Dip Buy",
          direction: "Long",
          entryPrice: 22.4,
          exitPrice: 21.15,
          shares: 150,
          pnl: -187.5,
          catalyst: false,
          catalystType: "",
          relVol: 4.2,
          float: 65.0,
          premarketHigh: 23.1,
          gapPct: 3.2,
          entryGrade: "C",
          exitGrade: "A",
          followedRules: false,
          emotionalState: "Reactive",
          sizedCorrectly: true,
          writeUp:
            "Dip buy in weak tape. No catalyst, too large a float. Dip kept going. Lesson: dip buys only on strong catalyst small cap names with high rel vol.",
          isBestOp: false,
        },
      ];

      // ============================================================
      // STATE
      // ============================================================
      let trades = [];
      let patterns = [...PATTERNS_DEFAULT];
      let playbookData = {};
      let patternKeyMap = {};
      let goals = { daily: 600, weekly: 3000, monthly: 12000, yearly: 150000 };
      let sortConfig = { col: "date", dir: "desc" };
      let dashWindow = parseInt(localStorage.getItem("smc_dash_window") || "90", 10);
      let formState = {
        direction: "Long",
        catalyst: true,
        entryGrade: "A",
        exitGrade: "A",
        followedRules: true,
        emotionalState: "Calm",
        sizedCorrectly: true,
      };
      let calYear = new Date().getFullYear();
      let charts = {};
      let editingId = null;
      let csvHeaders = [];
      let csvRows = [];
      let selectedTrades = new Set();
      let apiMetrics = {};

      // ============================================================
      // STORAGE
      // ============================================================
      async function saveGoals() {
        try {
          await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goals),
          });
        } catch (e) {
          // Fallback: save to localStorage if server unavailable
          localStorage.setItem('smc_goals', JSON.stringify(goals));
        }
      }

      async function loadData() {
        try {
          const [tradesResp, metricsResp, manualResp, goalsResp] = await Promise.all([
            fetch('/api/trades'),
            fetch('/api/metrics'),
            fetch('/api/trades/manual'),
            fetch('/api/goals'),
          ]);
          if (!tradesResp.ok || !metricsResp.ok) throw new Error('API unavailable');
          const apiTrades = await tradesResp.json();
          apiMetrics = await metricsResp.json();
          const manualTrades = manualResp.ok ? await manualResp.json() : [];
          if (goalsResp.ok) goals = await goalsResp.json();
          // Build lookup maps for merging
          const importedById = new Map(apiTrades.map(t => [t.trade_id, t]));
          const manualById = new Map(manualTrades.map(t => [t.id, t]));
          // Imported trades: use manual override if one exists (edits), else adapt from API
          const mergedImported = apiTrades.map(t =>
            manualById.has(t.trade_id) ? manualById.get(t.trade_id) : adaptApiTrade(t)
          );
          // Purely new manual trades (not edits of imported trades)
          const newManual = manualTrades.filter(t => !importedById.has(t.id));
          trades = [...mergedImported, ...newManual];
        } catch (e) {
          console.warn('Flask API not available, using demo data:', e.message);
          const st = localStorage.getItem('smc_trades');
          const jt = localStorage.getItem('trades');
          if (st) {
            trades = JSON.parse(st);
          } else if (jt) {
            trades = JSON.parse(jt).map(adaptApiTrade);
            localStorage.setItem('smc_trades', JSON.stringify(trades));
          } else {
            trades = [...DUMMY_TRADES];
            localStorage.setItem('smc_trades', JSON.stringify(trades));
          }
          const sg = localStorage.getItem('smc_goals');
          if (sg) goals = JSON.parse(sg);
        }
        loadPlaybook();
        renderDashboard();
        renderLog();
      }

      function adaptApiTrade(t) {
        return {
          id: t.trade_id || ('api-' + t.symbol + '-' + t.first_entry_dt),
          date: (t.first_entry_dt || '').slice(0, 10),
          ticker: t.symbol || '',
          pnl: t.gross_pnl || 0,
          pattern: t.strategy || '',
          direction: 'Long',
          entryPrice: t.avg_entry_price || 0,
          exitPrice: t.avg_exit_price || 0,
          shares: t.total_qty || 0,
          notes: t.notes || '',
          holdDisplay: t.hold_display || '',
          holdSeconds: t.hold_seconds || 0,
          mistakeTags: t.mistake_tags || [],
          rating: t.rating || 0,
          catalyst: false,
          catalystType: '',
          relVol: 0,
          float: 0,
          premarketHigh: 0,
          gapPct: 0,
          entryGrade: '',
          exitGrade: '',
          followedRules: true,
          emotionalState: 'Calm',
          sizedCorrectly: true,
          writeUp: t.notes || '',
          isBestOp: false,
        };
      }
      function saveTrades() {
        localStorage.setItem("smc_trades", JSON.stringify(trades));
      }
      function saveGoals() {
        localStorage.setItem("smc_goals", JSON.stringify(goals));
      }
      function loadPlaybook() {
        const sp = localStorage.getItem("smc_playbook");
        const ss = localStorage.getItem("smc_patterns");
        patterns = ss ? JSON.parse(ss) : [...PATTERNS_DEFAULT];
        playbookData = sp
          ? JSON.parse(sp)
          : JSON.parse(JSON.stringify(PLAYBOOK_DEFAULT));
        // Ensure every pattern has an entry in playbookData
        patterns.forEach((p) => {
          if (!playbookData[p])
            playbookData[p] = { setup: [], entry: "", failures: [] };
        });
      }
      function savePlaybook() {
        localStorage.setItem("smc_playbook", JSON.stringify(playbookData));
        localStorage.setItem("smc_patterns", JSON.stringify(patterns));
      }
      function uid() {
        return (
          "tr-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7)
        );
      }

      // ============================================================
      // NAVIGATION
      // ============================================================
