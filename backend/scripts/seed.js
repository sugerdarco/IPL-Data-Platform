const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '../Indian_Premier_League_2022-03-26');

// Helper function to read JSON file
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Helper to safely parse date
function parseDate(dateString) {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
}

async function main() {
  console.log('🚀 Starting IPL 2022 Data Migration...\n');

  try {
    // ==================== Step 1: Import Teams ====================
    console.log('📊 Step 1: Importing Teams...');
    const existingTeamsCount = await prisma.team.count();
    const teamsData = readJSON(path.join(DATA_DIR, 'teams/teams.json'));

    if (existingTeamsCount > 0) {
      console.log(`⏭️  Skipped: ${existingTeamsCount} teams already exist in database\n`);
    } else if (teamsData && Array.isArray(teamsData)) {
      for (const team of teamsData) {
        await prisma.team.upsert({
          where: { tid: team.tid },
          update: {
            title: team.title,
            abbr: team.abbr,
            altName: team.alt_name,
            type: team.type,
            thumbUrl: team.thumb_url,
            logoUrl: team.logo_url,
            country: team.country,
            sex: team.sex || 'male'
          },
          create: {
            tid: team.tid,
            title: team.title,
            abbr: team.abbr,
            altName: team.alt_name,
            type: team.type,
            thumbUrl: team.thumb_url,
            logoUrl: team.logo_url,
            country: team.country,
            sex: team.sex || 'male'
          }
        });
      }
      console.log(`✅ Imported ${teamsData.length} teams\n`);
    }

    // ==================== Step 2: Import Squads & Players ====================
    console.log('👥 Step 2: Importing Players & Squads...');
    const existingPlayersCount = await prisma.player.count();
    const squadsData = readJSON(path.join(DATA_DIR, 'squads/squads.json'));

    let playerCount = 0;
    if (existingPlayersCount > 0) {
      console.log(`⏭️  Skipped: ${existingPlayersCount} players already exist in database\n`);
      playerCount = existingPlayersCount;
    } else if (squadsData && Array.isArray(squadsData)) {
      for (const squad of squadsData) {
        const team = await prisma.team.findUnique({
          where: { tid: squad.team_id }
        });

        if (team && squad.players) {
          for (const player of squad.players) {
            // Create/update player
            const createdPlayer = await prisma.player.upsert({
              where: { pid: player.pid },
              update: {
                title: player.title,
                shortName: player.short_name,
                firstName: player.first_name,
                lastName: player.last_name,
                birthdate: player.birthdate,
                birthplace: player.birthplace,
                country: player.country,
                playingRole: player.playing_role,
                battingStyle: player.batting_style,
                bowlingStyle: player.bowling_style,
                fantasyRating: player.fantasy_player_rating,
                nationality: player.nationality,
                twitterProfile: player.twitter_profile,
                instagramProfile: player.instagram_profile
              },
              create: {
                pid: player.pid,
                title: player.title,
                shortName: player.short_name,
                firstName: player.first_name,
                lastName: player.last_name,
                birthdate: player.birthdate,
                birthplace: player.birthplace,
                country: player.country,
                playingRole: player.playing_role,
                battingStyle: player.batting_style,
                bowlingStyle: player.bowling_style,
                fantasyRating: player.fantasy_player_rating,
                nationality: player.nationality,
                twitterProfile: player.twitter_profile,
                instagramProfile: player.instagram_profile
              }
            });

            // Create squad relationship
            await prisma.teamSquad.upsert({
              where: {
                teamId_playerId_season: {
                  teamId: team.id,
                  playerId: createdPlayer.id,
                  season: '2022'
                }
              },
              update: {},
              create: {
                teamId: team.id,
                playerId: createdPlayer.id,
                season: '2022'
              }
            });

            playerCount++;
          }
        }
      }
      console.log(`✅ Imported ${playerCount} players and squad relationships\n`);
    }

    // ==================== Step 3: Import Player Career Stats ====================
    console.log('📈 Step 3: Importing Player Career Stats...');
    const existingCareerStatsCount = await prisma.playerCareerStats.count();
    const careerStatsDir = path.join(DATA_DIR, 'player_career_stats');
    const careerStatsFiles = fs.readdirSync(careerStatsDir).filter(f => f.endsWith('.json'));

    let careerStatsCount = 0;
    if (existingCareerStatsCount > 0) {
      console.log(`⏭️  Skipped: ${existingCareerStatsCount} player career stats already exist in database\n`);
      careerStatsCount = existingCareerStatsCount;
    } else {
    for (const file of careerStatsFiles) {
      const statsData = readJSON(path.join(careerStatsDir, file));
      if (statsData && statsData.player) {
        const player = await prisma.player.findUnique({
          where: { pid: statsData.player.pid }
        });

        if (player) {
          await prisma.playerCareerStats.upsert({
            where: { playerId: player.id },
            update: {
              battingStats: statsData.batting || {},
              bowlingStats: statsData.bowling || {}
            },
            create: {
              playerId: player.id,
              battingStats: statsData.batting || {},
              bowlingStats: statsData.bowling || {}
            }
          });
          careerStatsCount++;
        }
      }
    }
    console.log(`✅ Imported ${careerStatsCount} player career stats\n`);
    }

    // ==================== Step 4: Import Competition & Venues ====================
    console.log('🏆 Step 4: Importing Competition & Venues...');
    const existingVenuesCount = await prisma.venue.count();
    const existingCompetitionsCount = await prisma.competition.count();
    const matchesData = readJSON(path.join(DATA_DIR, 'matches/matches.json'));

    if (existingVenuesCount > 0 && existingCompetitionsCount > 0) {
      console.log(`⏭️  Skipped: ${existingCompetitionsCount} competition(s) and ${existingVenuesCount} venues already exist in database\n`);
    } else if (matchesData && Array.isArray(matchesData) && matchesData.length > 0) {
      // Import competition from first match
      const firstMatch = matchesData[0];
      if (firstMatch.competition) {
        await prisma.competition.upsert({
          where: { cid: firstMatch.competition.cid },
          update: {
            title: firstMatch.competition.title,
            abbr: firstMatch.competition.abbr,
            season: firstMatch.competition.season,
            totalMatches: parseInt(firstMatch.competition.total_matches),
            totalTeams: parseInt(firstMatch.competition.total_teams)
          },
          create: {
            cid: firstMatch.competition.cid,
            title: firstMatch.competition.title,
            abbr: firstMatch.competition.abbr,
            season: firstMatch.competition.season,
            totalMatches: parseInt(firstMatch.competition.total_matches),
            totalTeams: parseInt(firstMatch.competition.total_teams)
          }
        });
      }

      // Import venues
      const venueSet = new Map();
      for (const match of matchesData) {
        if (match.venue && !venueSet.has(match.venue.venue_id)) {
          venueSet.set(match.venue.venue_id, match.venue);
        }
      }

      for (const [venueId, venue] of venueSet) {
        await prisma.venue.upsert({
          where: { venueId: venueId },
          update: {
            name: venue.name,
            location: venue.location,
            country: venue.country,
            timezone: venue.timezone
          },
          create: {
            venueId: venueId,
            name: venue.name,
            location: venue.location,
            country: venue.country,
            timezone: venue.timezone
          }
        });
      }
      console.log(`✅ Imported competition and ${venueSet.size} venues\n`);
    }

    // ==================== Step 5: Import Matches ====================
    console.log('🏏 Step 5: Importing Matches...');
    const existingMatchesCount = await prisma.match.count();

    if (existingMatchesCount > 0) {
      console.log(`⏭️  Skipped: ${existingMatchesCount} matches already exist in database\n`);
    } else if (matchesData && Array.isArray(matchesData)) {
      const competition = await prisma.competition.findUnique({
        where: { cid: matchesData[0].competition.cid }
      });

      for (const match of matchesData) {
        const venue = await prisma.venue.findUnique({
          where: { venueId: match.venue.venue_id }
        });

        const teamA = await prisma.team.findUnique({
          where: { tid: match.teama.team_id }
        });

        const teamB = await prisma.team.findUnique({
          where: { tid: match.teamb.team_id }
        });

        if (venue && teamA && teamB && competition) {
          await prisma.match.upsert({
            where: { matchId: match.match_id },
            update: {
              title: match.title,
              shortTitle: match.short_title,
              subtitle: match.subtitle,
              matchNumber: match.match_number,
              format: match.format,
              formatStr: match.format_str,
              status: match.status,
              statusStr: match.status_str,
              statusNote: match.status_note,
              dateStart: parseDate(match.date_start),
              dateEnd: parseDate(match.date_end),
              timestampStart: BigInt(match.timestamp_start),
              timestampEnd: BigInt(match.timestamp_end),
              dateStartIst: parseDate(match.date_start_ist),
              dateEndIst: parseDate(match.date_end_ist),
              teamAId: teamA.id,
              teamAScoresFull: match.teama.scores_full,
              teamAScores: match.teama.scores,
              teamAOvers: match.teama.overs,
              teamBId: teamB.id,
              teamBScoresFull: match.teamb.scores_full,
              teamBScores: match.teamb.scores,
              teamBOvers: match.teamb.overs,
              result: match.result,
              resultType: match.result_type,
              winMargin: match.win_margin,
              winningTeamId: match.winning_team_id ? (await prisma.team.findUnique({ where: { tid: match.winning_team_id } }))?.id : null,
              tossText: match.toss?.text,
              tossWinnerId: match.toss?.winner ? (await prisma.team.findUnique({ where: { tid: match.toss.winner } }))?.id : null,
              tossDecision: match.toss?.decision,
              umpires: match.umpires,
              referee: match.referee,
              hasCommentary: match.commentary === 1,
              hasWagon: match.wagon === 1,
              latestInningNumber: match.latest_inning_number,
              venueId: venue.id,
              competitionId: competition.id
            },
            create: {
              matchId: match.match_id,
              title: match.title,
              shortTitle: match.short_title,
              subtitle: match.subtitle,
              matchNumber: match.match_number,
              format: match.format,
              formatStr: match.format_str,
              status: match.status,
              statusStr: match.status_str,
              statusNote: match.status_note,
              dateStart: parseDate(match.date_start),
              dateEnd: parseDate(match.date_end),
              timestampStart: BigInt(match.timestamp_start),
              timestampEnd: BigInt(match.timestamp_end),
              dateStartIst: parseDate(match.date_start_ist),
              dateEndIst: parseDate(match.date_end_ist),
              teamAId: teamA.id,
              teamAScoresFull: match.teama.scores_full,
              teamAScores: match.teama.scores,
              teamAOvers: match.teama.overs,
              teamBId: teamB.id,
              teamBScoresFull: match.teamb.scores_full,
              teamBScores: match.teamb.scores,
              teamBOvers: match.teamb.overs,
              result: match.result,
              resultType: match.result_type,
              winMargin: match.win_margin,
              winningTeamId: match.winning_team_id ? (await prisma.team.findUnique({ where: { tid: match.winning_team_id } }))?.id : null,
              tossText: match.toss?.text,
              tossWinnerId: match.toss?.winner ? (await prisma.team.findUnique({ where: { tid: match.toss.winner } }))?.id : null,
              tossDecision: match.toss?.decision,
              umpires: match.umpires,
              referee: match.referee,
              hasCommentary: match.commentary === 1,
              hasWagon: match.wagon === 1,
              latestInningNumber: match.latest_inning_number,
              venueId: venue.id,
              competitionId: competition.id
            }
          });
        }
      }
      console.log(`✅ Imported ${matchesData.length} matches\n`);
    }

    // ==================== Step 6: Import Scorecards (Innings, Batsmen, Bowlers) ====================
    console.log('📋 Step 6: Importing Scorecards (Innings, Batsmen, Bowlers)...');
    const existingInningsCount = await prisma.innings.count();
    const scorecardsDir = path.join(DATA_DIR, 'scorecards');
    const scorecardFiles = fs.readdirSync(scorecardsDir).filter(f => f.endsWith('.json'));

    let inningsCount = 0;
    let batsmenCount = 0;
    let bowlersCount = 0;

    if (existingInningsCount > 0) {
      const existingBatsmenCount = await prisma.batsman.count();
      const existingBowlersCount = await prisma.bowler.count();
      console.log(`⏭️  Skipped: ${existingInningsCount} innings, ${existingBatsmenCount} batsmen, ${existingBowlersCount} bowlers already exist in database\n`);
      inningsCount = existingInningsCount;
      batsmenCount = existingBatsmenCount;
      bowlersCount = existingBowlersCount;
    } else {
    for (const file of scorecardFiles) {
      const scorecardData = readJSON(path.join(scorecardsDir, file));

      if (scorecardData && scorecardData.innings) {
        const match = await prisma.match.findUnique({
          where: { matchId: scorecardData.match_id }
        });

        if (match) {
          for (const inning of scorecardData.innings) {
            const battingTeam = await prisma.team.findUnique({
              where: { tid: inning.batting_team_id }
            });
            const fieldingTeam = await prisma.team.findUnique({
              where: { tid: inning.fielding_team_id }
            });

            if (battingTeam && fieldingTeam) {
              // Create innings
              const createdInnings = await prisma.innings.upsert({
                where: { iid: inning.iid },
                update: {
                  matchId: match.id,
                  number: inning.number,
                  name: inning.name,
                  status: inning.status,
                  isSuperOver: inning.issuperover === 'true',
                  result: inning.result,
                  battingTeamId: battingTeam.id,
                  fieldingTeamId: fieldingTeam.id,
                  scores: inning.scores,
                  scoresFull: inning.scores_full,
                  runs: parseInt(inning.scores.split('/')[0]) || 0,
                  wickets: parseInt(inning.scores.split('/')[1]) || 0,
                  overs: parseFloat(inning.overs) || 0
                },
                create: {
                  iid: inning.iid,
                  matchId: match.id,
                  number: inning.number,
                  name: inning.name,
                  status: inning.status,
                  isSuperOver: inning.issuperover === 'true',
                  result: inning.result,
                  battingTeamId: battingTeam.id,
                  fieldingTeamId: fieldingTeam.id,
                  scores: inning.scores,
                  scoresFull: inning.scores_full,
                  runs: parseInt(inning.scores.split('/')[0]) || 0,
                  wickets: parseInt(inning.scores.split('/')[1]) || 0,
                  overs: parseFloat(inning.overs) || 0
                }
              });
              inningsCount++;

              // Import batsmen
              if (inning.batsmen) {
                for (let i = 0; i < inning.batsmen.length; i++) {
                  const batsman = inning.batsmen[i];
                  const player = await prisma.player.findUnique({
                    where: { pid: parseInt(batsman.batsman_id) }
                  });

                  if (player) {
                    await prisma.batsman.upsert({
                      where: {
                        inningsId_playerId: {
                          inningsId: createdInnings.id,
                          playerId: player.id
                        }
                      },
                      update: {
                        name: batsman.name,
                        position: i + 1,
                        runs: parseInt(batsman.runs) || 0,
                        ballsFaced: parseInt(batsman.balls_faced) || 0,
                        fours: parseInt(batsman.fours) || 0,
                        sixes: parseInt(batsman.sixes) || 0,
                        strikeRate: parseFloat(batsman.strike_rate) || 0,
                        howOut: batsman.how_out,
                        dismissal: batsman.dismissal,
                        bowlerId: batsman.bowler_id ? parseInt(batsman.bowler_id) : null,
                        isBatting: batsman.batting === 'true'
                      },
                      create: {
                        inningsId: createdInnings.id,
                        playerId: player.id,
                        name: batsman.name,
                        position: i + 1,
                        runs: parseInt(batsman.runs) || 0,
                        ballsFaced: parseInt(batsman.balls_faced) || 0,
                        fours: parseInt(batsman.fours) || 0,
                        sixes: parseInt(batsman.sixes) || 0,
                        strikeRate: parseFloat(batsman.strike_rate) || 0,
                        howOut: batsman.how_out,
                        dismissal: batsman.dismissal,
                        bowlerId: batsman.bowler_id ? parseInt(batsman.bowler_id) : null,
                        isBatting: batsman.batting === 'true'
                      }
                    });
                    batsmenCount++;
                  }
                }
              }

              // Import bowlers
              if (inning.bowlers) {
                for (const bowler of inning.bowlers) {
                  const player = await prisma.player.findUnique({
                    where: { pid: parseInt(bowler.bowler_id) }
                  });

                  if (player) {
                    await prisma.bowler.upsert({
                      where: {
                        inningsId_playerId: {
                          inningsId: createdInnings.id,
                          playerId: player.id
                        }
                      },
                      update: {
                        name: bowler.name,
                        overs: parseFloat(bowler.overs) || 0,
                        runsConceded: parseInt(bowler.runs_conceded) || 0,
                        wickets: parseInt(bowler.wickets) || 0,
                        maidens: parseInt(bowler.maidens) || 0,
                        noBalls: parseInt(bowler.noballs) || 0,
                        wides: parseInt(bowler.wides) || 0,
                        economy: parseFloat(bowler.econ) || 0,
                        dotBalls: parseInt(bowler.dotballs) || null
                      },
                      create: {
                        inningsId: createdInnings.id,
                        playerId: player.id,
                        name: bowler.name,
                        overs: parseFloat(bowler.overs) || 0,
                        runsConceded: parseInt(bowler.runs_conceded) || 0,
                        wickets: parseInt(bowler.wickets) || 0,
                        maidens: parseInt(bowler.maidens) || 0,
                        noBalls: parseInt(bowler.noballs) || 0,
                        wides: parseInt(bowler.wides) || 0,
                        economy: parseFloat(bowler.econ) || 0,
                        dotBalls: parseInt(bowler.dotballs) || null
                      }
                    });
                    bowlersCount++;
                  }
                }
              }

              // Import fall of wickets
              if (inning.fows) {
                for (const fow of inning.fows) {
                  await prisma.fallOfWicket.create({
                    data: {
                      inningsId: createdInnings.id,
                      name: fow.name,
                      runs: parseInt(fow.runs) || 0,
                      overs: parseFloat(fow.overs_at_dismissal) || 0,
                      score: `${fow.score_at_dismissal}/${fow.number}`
                    }
                  });
                }
              }
            }
          }
        }
      }
    }
    console.log(`✅ Imported ${inningsCount} innings, ${batsmenCount} batsmen records, ${bowlersCount} bowler records\n`);
    }

    // ==================== Step 7: Import Standings ====================
    console.log('🏅 Step 7: Importing Standings...');
    const existingStandingsCount = await prisma.standing.count();
    const standingsData = readJSON(path.join(DATA_DIR, 'standings/standings.json'));

    let standingsCount = 0;
    if (existingStandingsCount > 0) {
      console.log(`⏭️  Skipped: ${existingStandingsCount} standing records already exist in database\n`);
      standingsCount = existingStandingsCount;
    } else if (standingsData && standingsData.standings) {
      const competition = await prisma.competition.findFirst();

      for (const roundData of standingsData.standings) {
        if (roundData.standings) {
          for (const standing of roundData.standings) {
            const team = await prisma.team.findUnique({
              where: { tid: parseInt(standing.team_id) }
            });

            if (team && competition) {
              await prisma.standing.upsert({
                where: {
                  competitionId_teamId_roundId: {
                    competitionId: competition.id,
                    teamId: team.id,
                    roundId: roundData.round.rid
                  }
                },
                update: {
                  roundName: roundData.round.name,
                  played: parseInt(standing.played) || 0,
                  win: parseInt(standing.win) || 0,
                  loss: parseInt(standing.loss) || 0,
                  draw: parseInt(standing.draw) || 0,
                  nr: parseInt(standing.nr) || 0,
                  overFor: parseFloat(standing.overfor) || null,
                  runFor: parseInt(standing.runfor) || null,
                  overAgainst: parseFloat(standing.overagainst) || null,
                  runAgainst: parseInt(standing.runagainst) || null,
                  netRunRate: parseFloat(standing.netrr) || null,
                  points: parseInt(standing.points) || 0,
                  lastFiveMatches: standing.lastfivematch,
                  lastFiveResults: standing.lastfivematchresult,
                  qualified: standing.quality === 'true'
                },
                create: {
                  competitionId: competition.id,
                  teamId: team.id,
                  roundId: roundData.round.rid,
                  roundName: roundData.round.name,
                  played: parseInt(standing.played) || 0,
                  win: parseInt(standing.win) || 0,
                  loss: parseInt(standing.loss) || 0,
                  draw: parseInt(standing.draw) || 0,
                  nr: parseInt(standing.nr) || 0,
                  overFor: parseFloat(standing.overfor) || null,
                  runFor: parseInt(standing.runfor) || null,
                  overAgainst: parseFloat(standing.overagainst) || null,
                  runAgainst: parseInt(standing.runagainst) || null,
                  netRunRate: parseFloat(standing.netrr) || null,
                  points: parseInt(standing.points) || 0,
                  lastFiveMatches: standing.lastfivematch,
                  lastFiveResults: standing.lastfivematchresult,
                  qualified: standing.quality === 'true'
                }
              });
              standingsCount++;
            }
          }
        }
      }
      console.log(`✅ Imported ${standingsCount} standing records\n`);
    }

    // ==================== Step 8: Import Batting Aggregates ====================
    console.log('🏏 Step 8: Importing Batting Aggregates...');
    const existingBattingAggCount = await prisma.battingAggregate.count();
    const battingStatsDir = path.join(DATA_DIR, 'batting_stats');
    const battingFiles = fs.readdirSync(battingStatsDir).filter(f => f.endsWith('.json'));

    let battingAggCount = 0;
    if (existingBattingAggCount > 0) {
      console.log(`⏭️  Skipped: ${existingBattingAggCount} batting aggregate records already exist in database\n`);
      battingAggCount = existingBattingAggCount;
    } else {
    for (const file of battingFiles) {
      const statsData = readJSON(path.join(battingStatsDir, file));
      const statType = file.replace('.json', '').replace('batting_', '');

      if (statsData && statsData.response && statsData.response.stats) {
        for (const stat of statsData.response.stats) {
          const player = await prisma.player.findUnique({
            where: { pid: stat.player.pid }
          });
          const team = await prisma.team.findUnique({
            where: { tid: stat.team.tid }
          });

          if (player && team) {
            await prisma.battingAggregate.upsert({
              where: {
                playerId_statType: {
                  playerId: player.id,
                  statType: statType
                }
              },
              update: {
                teamId: team.id,
                matches: parseInt(stat.matches) || 0,
                innings: parseInt(stat.innings) || 0,
                runs: parseInt(stat.runs) || 0,
                balls: parseInt(stat.balls) || 0,
                notOut: parseInt(stat.notout) || 0,
                highest: parseInt(stat.highest) || null,
                centuries: parseInt(stat.run100) || 0,
                fifties: parseInt(stat.run50) || 0,
                fours: parseInt(stat.run4) || 0,
                sixes: parseInt(stat.run6) || 0,
                catches: parseInt(stat.catches) || 0,
                stumpings: parseInt(stat.stumpings) || 0,
                average: parseFloat(stat.average) || null,
                strikeRate: parseFloat(stat.strike) || null
              },
              create: {
                playerId: player.id,
                teamId: team.id,
                statType: statType,
                matches: parseInt(stat.matches) || 0,
                innings: parseInt(stat.innings) || 0,
                runs: parseInt(stat.runs) || 0,
                balls: parseInt(stat.balls) || 0,
                notOut: parseInt(stat.notout) || 0,
                highest: parseInt(stat.highest) || null,
                centuries: parseInt(stat.run100) || 0,
                fifties: parseInt(stat.run50) || 0,
                fours: parseInt(stat.run4) || 0,
                sixes: parseInt(stat.run6) || 0,
                catches: parseInt(stat.catches) || 0,
                stumpings: parseInt(stat.stumpings) || 0,
                average: parseFloat(stat.average) || null,
                strikeRate: parseFloat(stat.strike) || null
              }
            });
            battingAggCount++;
          }
        }
      }
    }
    console.log(`✅ Imported ${battingAggCount} batting aggregate records\n`);
    }

    // ==================== Step 9: Import Bowling Aggregates ====================
    console.log('🎯 Step 9: Importing Bowling Aggregates...');
    const existingBowlingAggCount = await prisma.bowlingAggregate.count();
    const bowlingStatsDir = path.join(DATA_DIR, 'bowling_stats');
    const bowlingFiles = fs.readdirSync(bowlingStatsDir).filter(f => f.endsWith('.json'));

    let bowlingAggCount = 0;
    if (existingBowlingAggCount > 0) {
      console.log(`⏭️  Skipped: ${existingBowlingAggCount} bowling aggregate records already exist in database\n`);
      bowlingAggCount = existingBowlingAggCount;
    } else {
    for (const file of bowlingFiles) {
      const statsData = readJSON(path.join(bowlingStatsDir, file));
      const statType = file.replace('.json', '').replace('bowling_', '');

      if (statsData && statsData.response && statsData.response.stats) {
        for (const stat of statsData.response.stats) {
          const player = await prisma.player.findUnique({
            where: { pid: stat.player.pid }
          });
          const team = await prisma.team.findUnique({
            where: { tid: stat.team.tid }
          });

          if (player && team) {
            await prisma.bowlingAggregate.upsert({
              where: {
                playerId_statType: {
                  playerId: player.id,
                  statType: statType
                }
              },
              update: {
                teamId: team.id,
                matches: parseInt(stat.matches) || 0,
                overs: parseFloat(stat.overs) || 0,
                runs: parseInt(stat.runs) || 0,
                wickets: parseInt(stat.wickets) || 0,
                maidens: parseInt(stat.maidens) || 0,
                average: parseFloat(stat.average) || null,
                economy: parseFloat(stat.econ) || null,
                strikeRate: parseFloat(stat.strike) || null,
                bestInning: stat.bestinning,
                bestMatch: stat.bestmatch,
                wicket4i: parseInt(stat.wicket4i) || 0,
                wicket5i: parseInt(stat.wicket5i) || 0
              },
              create: {
                playerId: player.id,
                teamId: team.id,
                statType: statType,
                matches: parseInt(stat.matches) || 0,
                overs: parseFloat(stat.overs) || 0,
                runs: parseInt(stat.runs) || 0,
                wickets: parseInt(stat.wickets) || 0,
                maidens: parseInt(stat.maidens) || 0,
                average: parseFloat(stat.average) || null,
                economy: parseFloat(stat.econ) || null,
                strikeRate: parseFloat(stat.strike) || null,
                bestInning: stat.bestinning,
                bestMatch: stat.bestmatch,
                wicket4i: parseInt(stat.wicket4i) || 0,
                wicket5i: parseInt(stat.wicket5i) || 0
              }
            });
            bowlingAggCount++;
          }
        }
      }
    }
    console.log(`✅ Imported ${bowlingAggCount} bowling aggregate records\n`);
    }

    // ==================== Step 10: Import Team Stats ====================
    console.log('📊 Step 10: Importing Team Stats...');
    const existingTeamStatsCount = await prisma.teamStats.count();
    const teamStatsDir = path.join(DATA_DIR, 'team_stats');

    let teamStatsCount = 0;
    if (existingTeamStatsCount > 0) {
      console.log(`⏭️  Skipped: ${existingTeamStatsCount} team stats already exist in database\n`);
      teamStatsCount = existingTeamStatsCount;
    } else {
      // Read all team stat files to aggregate data
      const teamStatsMap = new Map();
      
      // Read team_total_runs.json for runs data
      const totalRunsData = readJSON(path.join(teamStatsDir, 'team_total_runs.json'));
      if (totalRunsData?.response?.stats) {
        for (const stat of totalRunsData.response.stats) {
          const team = await prisma.team.findUnique({ where: { tid: stat.team.tid } });
          if (team) {
            teamStatsMap.set(team.id, {
              teamId: team.id,
              totalRuns: parseInt(stat.runs) || 0,
              totalWickets: parseInt(stat.wickets) || 0,
              totalCenturies: parseInt(stat.run100) || 0,
              totalFifties: parseInt(stat.run50) || 0
            });
          }
        }
      }

      // Read team_match_win.json for wins data
      const matchWinData = readJSON(path.join(teamStatsDir, 'team_match_win.json'));
      if (matchWinData?.response?.stats) {
        for (const stat of matchWinData.response.stats) {
          const team = await prisma.team.findUnique({ where: { tid: stat.team.tid } });
          if (team && teamStatsMap.has(team.id)) {
            teamStatsMap.get(team.id).matchesWon = parseInt(stat.win) || 0;
          }
        }
      }

      // Read team_extra_run_conceded.json
      const extraRunData = readJSON(path.join(teamStatsDir, 'team_extra_run_conceded.json'));
      if (extraRunData?.response?.stats) {
        for (const stat of extraRunData.response.stats) {
          const team = await prisma.team.findUnique({ where: { tid: stat.team.tid } });
          if (team && teamStatsMap.has(team.id)) {
            teamStatsMap.get(team.id).extraRunsConceded = parseInt(stat.extras) || 0;
          }
        }
      }

      // Read team_highest_score.json
      const highestScoreData = readJSON(path.join(teamStatsDir, 'team_highest_score.json'));
      if (highestScoreData?.response?.stats) {
        for (const stat of highestScoreData.response.stats) {
          const team = await prisma.team.findUnique({ where: { tid: stat.team.tid } });
          if (team && teamStatsMap.has(team.id)) {
            teamStatsMap.get(team.id).highestScore = stat.score || null;
          }
        }
      }

      // Read team_lowest_score.json
      const lowestScoreData = readJSON(path.join(teamStatsDir, 'team_lowest_score.json'));
      if (lowestScoreData?.response?.stats) {
        for (const stat of lowestScoreData.response.stats) {
          const team = await prisma.team.findUnique({ where: { tid: stat.team.tid } });
          if (team && teamStatsMap.has(team.id)) {
            teamStatsMap.get(team.id).lowestScore = stat.score || null;
          }
        }
      }

      // Read win margins
      const highestWinRunsData = readJSON(path.join(teamStatsDir, 'team_highest_win_margin_runs.json'));
      if (highestWinRunsData?.response?.stats) {
        for (const stat of highestWinRunsData.response.stats) {
          const team = await prisma.team.findUnique({ where: { tid: stat.team.tid } });
          if (team && teamStatsMap.has(team.id)) {
            teamStatsMap.get(team.id).highestWinMarginRuns = parseInt(stat.margin) || null;
          }
        }
      }

      const lowestWinRunsData = readJSON(path.join(teamStatsDir, 'team_lowest_win_margin_runs.json'));
      if (lowestWinRunsData?.response?.stats) {
        for (const stat of lowestWinRunsData.response.stats) {
          const team = await prisma.team.findUnique({ where: { tid: stat.team.tid } });
          if (team && teamStatsMap.has(team.id)) {
            teamStatsMap.get(team.id).lowestWinMarginRuns = parseInt(stat.margin) || null;
          }
        }
      }

      const highestWinWicketsData = readJSON(path.join(teamStatsDir, 'team_highest_win_margin_wickets.json'));
      if (highestWinWicketsData?.response?.stats) {
        for (const stat of highestWinWicketsData.response.stats) {
          const team = await prisma.team.findUnique({ where: { tid: stat.team.tid } });
          if (team && teamStatsMap.has(team.id)) {
            teamStatsMap.get(team.id).highestWinMarginWickets = parseInt(stat.margin) || null;
          }
        }
      }

      const lowestWinWicketsData = readJSON(path.join(teamStatsDir, 'team_lowest_win_margin_wickets.json'));
      if (lowestWinWicketsData?.response?.stats) {
        for (const stat of lowestWinWicketsData.response.stats) {
          const team = await prisma.team.findUnique({ where: { tid: stat.team.tid } });
          if (team && teamStatsMap.has(team.id)) {
            teamStatsMap.get(team.id).lowestWinMarginWickets = parseInt(stat.margin) || null;
          }
        }
      }

      // Insert team stats
      for (const [teamId, stats] of teamStatsMap) {
        await prisma.teamStats.upsert({
          where: { teamId },
          update: stats,
          create: stats
        });
        teamStatsCount++;
      }
      console.log(`✅ Imported ${teamStatsCount} team stats records\n`);
    }

    // ==================== Step 11: Import Wagon Wheels ====================
    console.log('🎯 Step 11: Importing Wagon Wheels...');
    const existingWagonCount = await prisma.wagonWheel.count();
    const wagonWheelDir = path.join(DATA_DIR, 'match_wagon_wheel');
    const wagonWheelFiles = fs.readdirSync(wagonWheelDir).filter(f => f.endsWith('.json'));
    
    // Zone mapping
    const zoneNames = ['Fine Leg', 'Square Leg', 'Mid Wicket', 'Long on', 'Long of', 'Cover', 'Point', '3rd man'];
    const BATCH_SIZE = 1000; // Process 1000 records at a time

    let wagonCount = 0;
    if (existingWagonCount > 0) {
      console.log(`⏭️  Skipped: ${existingWagonCount} wagon wheel records already exist in database\n`);
      wagonCount = existingWagonCount;
    } else {
      // Collect all wagon wheel data first
      const allWagonData = [];
      
      for (const file of wagonWheelFiles) {
        const wagonData = readJSON(path.join(wagonWheelDir, file));
        
        if (wagonData && wagonData.innings) {
          for (const inning of wagonData.innings) {
            // Find the match and innings in database
            const dbInnings = await prisma.innings.findUnique({
              where: { iid: inning.inning_id },
              include: { match: true }
            });

            if (dbInnings && inning.wagons) {
              // wagon_fields: ['batsman_id', 'bowler_id', 'over', 'bat_run', 'team_run', 'x', 'y', 'zone_id', 'event_name', 'unique_over']
              for (const wagon of inning.wagons) {
                const [batsmanPid, bowlerPid, over, batRun, teamRun, x, y, zoneId, eventName, uniqueOver] = wagon;
                
                allWagonData.push({
                  matchId: dbInnings.matchId,
                  inningsId: dbInnings.id,
                  batsmanId: batsmanPid,
                  bowlerId: bowlerPid,
                  over: parseFloat(over) || 0,
                  batRun: batRun || 0,
                  teamRun: teamRun || 0,
                  xCoord: x || 0,
                  yCoord: y || 0,
                  zoneId: zoneId || 0,
                  zoneName: zoneNames[zoneId] || null,
                  eventName: eventName || '',
                  uniqueOver: parseFloat(uniqueOver) || 0
                });
              }
            }
          }
        }
      }

      console.log(`   Prepared ${allWagonData.length} wagon wheel records, inserting all at once...`);
      
      // Insert all data in a single bulk operation
      try {
        const result = await prisma.wagonWheel.createMany({
          data: allWagonData,
          skipDuplicates: true
        });
        wagonCount = result.count;
        console.log(`✅ Imported ${wagonCount} wagon wheel records\n`);
      } catch (err) {
        console.error(`   Bulk insert failed: ${err.message}`);
        console.log(`   Falling back to batch insert...`);
        
        // Fallback to batches if single insert fails
        const BATCH_SIZE = 10000;
        for (let i = 0; i < allWagonData.length; i += BATCH_SIZE) {
          const batch = allWagonData.slice(i, i + BATCH_SIZE);
          try {
            const result = await prisma.wagonWheel.createMany({
              data: batch,
              skipDuplicates: true
            });
            wagonCount += result.count;
          } catch (batchErr) {
            console.error(`   Batch ${i / BATCH_SIZE} failed: ${batchErr.message}`);
          }
          console.log(`   Progress: ${wagonCount}/${allWagonData.length} records...`);
        }
        console.log(`✅ Imported ${wagonCount} wagon wheel records\n`);
      }
    }

    // ==================== Step 12: Import Commentaries ====================
    console.log('💬 Step 12: Importing Commentaries...');
    const existingCommentaryCount = await prisma.commentary.count();
    const commentaryDir = path.join(DATA_DIR, 'match_innings_commentary');
    const commentaryFiles = fs.readdirSync(commentaryDir).filter(f => f.endsWith('.json'));
    const COMMENTARY_BATCH_SIZE = 500; // Records per batch
    const PARALLEL_BATCHES = 10; // Run 10 batches in parallel

    let commentaryCount = 0;
    if (existingCommentaryCount > 0) {
      console.log(`⏭️  Skipped: ${existingCommentaryCount} commentary records already exist in database\n`);
      commentaryCount = existingCommentaryCount;
    } else {
      // Collect all commentary data first - process files in parallel
      console.log(`   Reading ${commentaryFiles.length} commentary files...`);
      
      // Pre-fetch all innings data to avoid repeated DB calls
      const allInnings = await prisma.innings.findMany({
        select: { id: true, iid: true, matchId: true }
      });
      const inningsMap = new Map(allInnings.map(i => [i.iid, { id: i.id, matchId: i.matchId }]));
      
      const allCommentaryData = [];
      
      for (const file of commentaryFiles) {
        const commData = readJSON(path.join(commentaryDir, file));
        
        if (commData && commData.inning && commData.commentaries) {
          const dbInnings = inningsMap.get(commData.inning.iid);

          if (dbInnings) {
            for (let idx = 0; idx < commData.commentaries.length; idx++) {
              const comm = commData.commentaries[idx];
              // Generate eventId if missing: use innings_id + index
              const eventId = comm.event_id || `${commData.inning.iid}_${idx}`;
              
              allCommentaryData.push({
                eventId: eventId,
                matchId: dbInnings.matchId,
                inningsId: dbInnings.id,
                event: comm.event || 'ball',
                batsmanId: comm.batsman_id ? parseInt(comm.batsman_id) : null,
                bowlerId: comm.bowler_id ? parseInt(comm.bowler_id) : null,
                over: parseInt(comm.over) || 0,
                ball: parseInt(comm.ball) || 0,
                commentary: comm.commentary || '',
                run: parseInt(comm.run) || 0,
                isWide: comm.wideball === true,
                isNoBall: comm.noball === true,
                isSix: comm.six === true,
                isFour: comm.four === true,
                isWicket: comm.event === 'wicket'
              });
            }
          }
        }
      }

      console.log(`   Prepared ${allCommentaryData.length} commentary records, inserting all at once...`);
      
      // Insert all data in a single bulk operation
      try {
        const result = await prisma.commentary.createMany({
          data: allCommentaryData,
          skipDuplicates: true
        });
        commentaryCount = result.count;
        console.log(`✅ Imported ${commentaryCount} commentary records\n`);
      } catch (err) {
        console.error(`   Bulk insert failed: ${err.message}`);
        console.log(`   Falling back to batch insert...`);
        
        // Fallback to batches if single insert fails
        const BATCH_SIZE = 5000;
        for (let i = 0; i < allCommentaryData.length; i += BATCH_SIZE) {
          const batch = allCommentaryData.slice(i, i + BATCH_SIZE);
          try {
            const result = await prisma.commentary.createMany({
              data: batch,
              skipDuplicates: true
            });
            commentaryCount += result.count;
          } catch (batchErr) {
            console.error(`   Batch ${i / BATCH_SIZE} failed: ${batchErr.message}`);
          }
          console.log(`   Progress: ${commentaryCount}/${allCommentaryData.length} records...`);
        }
        console.log(`✅ Imported ${commentaryCount} commentary records\n`);
      }
    }

    console.log('🎉 Migration Complete!\n');
    console.log('Summary:');
    console.log(`  - Teams: ${teamsData.length}`);
    console.log(`  - Players: ${playerCount}`);
    console.log(`  - Career Stats: ${careerStatsCount}`);
    console.log(`  - Matches: ${matchesData.length}`);
    console.log(`  - Innings: ${inningsCount}`);
    console.log(`  - Batsmen Records: ${batsmenCount}`);
    console.log(`  - Bowler Records: ${bowlersCount}`);
    console.log(`  - Standings: ${standingsCount}`);
    console.log(`  - Batting Aggregates: ${battingAggCount}`);
    console.log(`  - Bowling Aggregates: ${bowlingAggCount}`);
    console.log(`  - Team Stats: ${teamStatsCount}`);
    console.log(`  - Wagon Wheels: ${wagonCount}`);
    console.log(`  - Commentaries: ${commentaryCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
