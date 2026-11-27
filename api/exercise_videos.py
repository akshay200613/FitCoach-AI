import urllib.parse

# Curated exercise video database with verified YouTube video IDs
# Each exercise maps to a trusted fitness education channel video
EXERCISE_VIDEOS = {
    # CHEST
    'barbell bench press': {'videoId': 'rT7DgCr-3pg', 'channel': 'ScottHermanFitness'},
    'dumbbell bench press': {'videoId': 'VmB1G1K7v94', 'channel': 'ScottHermanFitness'},
    'incline dumbbell press': {'videoId': '8iPEnn-ltC8', 'channel': 'ScottHermanFitness'},
    'incline barbell bench press': {'videoId': 'SrqOu55lrYU', 'channel': 'JEFIT'},
    'decline bench press': {'videoId': 'LfyQBUKR8SE', 'channel': 'ScottHermanFitness'},
    'push ups': {'videoId': 'IODxDxX7oi4', 'channel': 'Calisthenicmovement'},
    'push-ups': {'videoId': 'IODxDxX7oi4', 'channel': 'Calisthenicmovement'},
    'wide push ups': {'videoId': 'pfMrNJrrSQQ', 'channel': 'JEFIT'},
    'diamond push ups': {'videoId': 'J0DnG1_S92I', 'channel': 'Calisthenicmovement'},
    'dumbbell flyes': {'videoId': 'eozdVDA78K0', 'channel': 'ScottHermanFitness'},
    'cable crossover': {'videoId': 'taI4XduLpTk', 'channel': 'ScottHermanFitness'},
    'chest dips': {'videoId': '2z8JmcrW-As', 'channel': 'ScottHermanFitness'},
    'pec deck fly': {'videoId': 'Z57CtFmRMxA', 'channel': 'ScottHermanFitness'},

    # BACK
    'pull ups': {'videoId': 'eGo4IYlbE5g', 'channel': 'Calisthenicmovement'},
    'chin ups': {'videoId': 'brhRXlOhWI8', 'channel': 'ScottHermanFitness'},
    'lat pulldown': {'videoId': 'CAwf7n6Luuc', 'channel': 'ScottHermanFitness'},
    'barbell row': {'videoId': 'FWJR5Ve8bnQ', 'channel': 'AlanThrall'},
    'bent over barbell row': {'videoId': 'FWJR5Ve8bnQ', 'channel': 'AlanThrall'},
    'dumbbell row': {'videoId': 'pYcpY20QaE8', 'channel': 'ScottHermanFitness'},
    'one arm dumbbell row': {'videoId': 'pYcpY20QaE8', 'channel': 'ScottHermanFitness'},
    'seated cable row': {'videoId': 'GZbfZ033f74', 'channel': 'ScottHermanFitness'},
    't-bar row': {'videoId': 'j3Igk5nyZE4', 'channel': 'ScottHermanFitness'},
    'face pull': {'videoId': 'rep-qVOkqgk', 'channel': 'JeffNippard'},
    'deadlift': {'videoId': 'op9kVnSso6Q', 'channel': 'AlanThrall'},
    'hyperextension': {'videoId': 'ph3pddpKzzw', 'channel': 'ScottHermanFitness'},
    'superman': {'videoId': 'z6PJMT2y8GQ', 'channel': 'JEFIT'},

    # SHOULDERS
    'overhead press': {'videoId': 'QAQ64hK4Xxs', 'channel': 'AlanThrall'},
    'military press': {'videoId': 'QAQ64hK4Xxs', 'channel': 'AlanThrall'},
    'dumbbell shoulder press': {'videoId': 'qEwKCR5JCog', 'channel': 'ScottHermanFitness'},
    'seated dumbbell press': {'videoId': 'qEwKCR5JCog', 'channel': 'ScottHermanFitness'},
    'lateral raise': {'videoId': '3VcKaXpzqRo', 'channel': 'JeffNippard'},
    'dumbbell lateral raise': {'videoId': '3VcKaXpzqRo', 'channel': 'JeffNippard'},
    'front raise': {'videoId': '-t7fuZ0KhDA', 'channel': 'ScottHermanFitness'},
    'rear delt fly': {'videoId': 'EA7u4Q_8HQ0', 'channel': 'ScottHermanFitness'},
    'arnold press': {'videoId': '6Z15_WdXmVw', 'channel': 'ScottHermanFitness'},
    'upright row': {'videoId': 'amCU-ziHITM', 'channel': 'ScottHermanFitness'},
    'shrugs': {'videoId': 'cJRVVxmytaM', 'channel': 'ScottHermanFitness'},
    'dumbbell shrugs': {'videoId': 'cJRVVxmytaM', 'channel': 'ScottHermanFitness'},

    # BICEPS
    'barbell curl': {'videoId': 'kwG2ipFRgFo', 'channel': 'ScottHermanFitness'},
    'dumbbell curl': {'videoId': 'ykJmrZ5v0Oo', 'channel': 'ScottHermanFitness'},
    'dumbbell bicep curl': {'videoId': 'ykJmrZ5v0Oo', 'channel': 'ScottHermanFitness'},
    'hammer curl': {'videoId': 'zC3nLlEvin4', 'channel': 'ScottHermanFitness'},
    'concentration curl': {'videoId': '0AUGkch3tzc', 'channel': 'ScottHermanFitness'},
    'preacher curl': {'videoId': 'fIWP-FRFNU0', 'channel': 'ScottHermanFitness'},
    'incline dumbbell curl': {'videoId': 'soxrZlIl35U', 'channel': 'ScottHermanFitness'},
    'cable curl': {'videoId': 'NFzpMYx5tFM', 'channel': 'ScottHermanFitness'},
    'resistance band curl': {'videoId': 'P6MDRMX81hA', 'channel': 'JEFIT'},

    # TRICEPS
    'tricep pushdown': {'videoId': '2-LAMcpzODU', 'channel': 'ScottHermanFitness'},
    'tricep rope pushdown': {'videoId': 'vB5OHsJ3EME', 'channel': 'ScottHermanFitness'},
    'overhead tricep extension': {'videoId': '_gsUck-7M74', 'channel': 'ScottHermanFitness'},
    'dumbbell tricep extension': {'videoId': '_gsUck-7M74', 'channel': 'ScottHermanFitness'},
    'skull crushers': {'videoId': 'd_KZxkY_0cM', 'channel': 'ScottHermanFitness'},
    'close grip bench press': {'videoId': 'nEF0bv2FW94', 'channel': 'ScottHermanFitness'},
    'tricep dips': {'videoId': '0326dy_-CzM', 'channel': 'ScottHermanFitness'},
    'bench dips': {'videoId': '0326dy_-CzM', 'channel': 'ScottHermanFitness'},
    'tricep kickback': {'videoId': 'ZO81bExngMI', 'channel': 'ScottHermanFitness'},

    # LEGS
    'barbell squat': {'videoId': 'ultWZbUMPL8', 'channel': 'AlanThrall'},
    'squat': {'videoId': 'ultWZbUMPL8', 'channel': 'AlanThrall'},
    'goblet squat': {'videoId': 'MeIiIdhvXT4', 'channel': 'ScottHermanFitness'},
    'bodyweight squat': {'videoId': 'aclHkVaku9U', 'channel': 'JEFIT'},
    'leg press': {'videoId': 'IZxyjW7MPJQ', 'channel': 'ScottHermanFitness'},
    'lunges': {'videoId': 'D7KaRcUTQeE', 'channel': 'ScottHermanFitness'},
    'walking lunges': {'videoId': 'D7KaRcUTQeE', 'channel': 'ScottHermanFitness'},
    'dumbbell lunges': {'videoId': 'D7KaRcUTQeE', 'channel': 'ScottHermanFitness'},
    'bulgarian split squat': {'videoId': '2C-uNgKwPLE', 'channel': 'ScottHermanFitness'},
    'leg extension': {'videoId': 'YyvSfVjQeL0', 'channel': 'ScottHermanFitness'},
    'leg curl': {'videoId': '1Tq3QdYUuHs', 'channel': 'ScottHermanFitness'},
    'hamstring curl': {'videoId': '1Tq3QdYUuHs', 'channel': 'ScottHermanFitness'},
    'romanian deadlift': {'videoId': 'JCXUYuzwNrM', 'channel': 'AlanThrall'},
    'calf raise': {'videoId': 'gwLzBJYoWlI', 'channel': 'ScottHermanFitness'},
    'standing calf raise': {'videoId': 'gwLzBJYoWlI', 'channel': 'ScottHermanFitness'},
    'hip thrust': {'videoId': 'SEdqd1n0icg', 'channel': 'BretContreras'},
    'glute bridge': {'videoId': 'OUgsJ8-Vi0E', 'channel': 'JEFIT'},
    'step ups': {'videoId': 'dQqApCGd5Ag', 'channel': 'JEFIT'},
    'wall sit': {'videoId': 'y-wV4Lk_YKQ', 'channel': 'JEFIT'},
    'sumo squat': {'videoId': '9ZuXKqRbT9k', 'channel': 'JEFIT'},

    # ABS / CORE
    'crunches': {'videoId': 'Xyd_fa5zoEU', 'channel': 'JEFIT'},
    'bicycle crunches': {'videoId': '9FGilxCbdz8', 'channel': 'JEFIT'},
    'plank': {'videoId': 'ASdvN_XEl_c', 'channel': 'JEFIT'},
    'side plank': {'videoId': 'K2VljzCC16g', 'channel': 'JEFIT'},
    'mountain climbers': {'videoId': 'nmwgirgXLYM', 'channel': 'JEFIT'},
    'leg raise': {'videoId': 'JB2oyawG9KI', 'channel': 'ScottHermanFitness'},
    'hanging leg raise': {'videoId': 'hdng3Nm1x_E', 'channel': 'ScottHermanFitness'},
    'russian twist': {'videoId': 'wkD8rjkodUI', 'channel': 'JEFIT'},
    'ab rollout': {'videoId': 'rqiTPdK1c_I', 'channel': 'ScottHermanFitness'},
    'dead bug': {'videoId': 'I5xbsA71v1A', 'channel': 'JEFIT'},
    'flutter kicks': {'videoId': 'ANVdMDaYRts', 'channel': 'JEFIT'},
    'v-ups': {'videoId': 'iP2fjvG0g3w', 'channel': 'JEFIT'},
    'toe touches': {'videoId': 'wNONMB86R6E', 'channel': 'JEFIT'},
    'wood chop': {'videoId': 'pAplQXk3dkU', 'channel': 'JEFIT'},
    'cable crunch': {'videoId': 'AV5PmTNRMKs', 'channel': 'ScottHermanFitness'},

    # CARDIO
    'jumping jacks': {'videoId': 'c4DAnQ6DtF8', 'channel': 'JEFIT'},
    'burpees': {'videoId': 'dZgVxmf6jkA', 'channel': 'JEFIT'},
    'high knees': {'videoId': 'D0096USOQXM', 'channel': 'JEFIT'},
    'jump rope': {'videoId': 'd_4RKNqiAyM', 'channel': 'CrossRope'},
    'box jumps': {'videoId': 'NBY9-kTuHEk', 'channel': 'JEFIT'},
    'battle ropes': {'videoId': 'O28jlXaJCmE', 'channel': 'JEFIT'},
    'rowing machine': {'videoId': 'H0r8Nv4D3Bw', 'channel': 'JEFIT'},
    'treadmill running': {'videoId': 'eHYJn-s1LkE', 'channel': 'JEFIT'},
    'stationary bike': {'videoId': 'vT8M6Hvwz5k', 'channel': 'JEFIT'},

    # FULL BODY / COMPOUND
    'kettlebell swing': {'videoId': 'YSxHifyI6s8', 'channel': 'AlanThrall'},
    'clean and press': {'videoId': 'e1VL0xm2Ffk', 'channel': 'AlanThrall'},
    'farmer walk': {'videoId': 'Fkzk_RqlYig', 'channel': 'AlanThrall'},
    'bear crawl': {'videoId': 'RvRjJdDqdpI', 'channel': 'JEFIT'},
    'inchworm': {'videoId': 'VSp3FMk0EBo', 'channel': 'JEFIT'},
    'turkish get up': {'videoId': '0bWRPC49-KI', 'channel': 'AlanThrall'},
    'thrusters': {'videoId': 'L219ltL15zk', 'channel': 'CrossFit'},

    # STRETCHING / MOBILITY
    'cat cow stretch': {'videoId': 'kqnua4rHVVA', 'channel': 'JEFIT'},
    'child pose': {'videoId': 'eqVMAPM00DM', 'channel': 'JEFIT'},
    'hip flexor stretch': {'videoId': 'YQmpO9VT2go', 'channel': 'JEFIT'},
    'hamstring stretch': {'videoId': 'FDwpEdxZ3H4', 'channel': 'JEFIT'},
    'shoulder stretch': {'videoId': 'eSbk4JpYuog', 'channel': 'JEFIT'},
    'quad stretch': {'videoId': '0SA8WuS0Dw0', 'channel': 'JEFIT'},
    'foam rolling': {'videoId': 'AT-gS0JDjf8', 'channel': 'JEFIT'},
}


def get_exercise_video(exercise_name: str) -> dict:
    if not exercise_name:
        return {'videoId': None, 'url': '', 'channel': 'FitCoach AI'}

    key = exercise_name.lower().strip()

    # Direct match
    if key in EXERCISE_VIDEOS:
        vid = EXERCISE_VIDEOS[key]
        return {
            'videoId': vid['videoId'],
            'url': f"https://www.youtube.com/embed/{vid['videoId']}",
            'channel': vid['channel'],
        }

    # Fuzzy match
    for ex_key, data in EXERCISE_VIDEOS.items():
        if key in ex_key or ex_key in key:
            return {
                'videoId': data['videoId'],
                'url': f"https://www.youtube.com/embed/{data['videoId']}",
                'channel': data['channel'],
            }

    # Word match
    words = [w for w in key.split() if len(w) > 2]
    for ex_key, data in EXERCISE_VIDEOS.items():
        match_count = sum(1 for w in words if w in ex_key)
        if match_count >= 2 or (len(words) == 1 and match_count == 1):
            return {
                'videoId': data['videoId'],
                'url': f"https://www.youtube.com/embed/{data['videoId']}",
                'channel': data['channel'],
            }

    # Fallback to search query embed
    query = urllib.parse.quote(f"{exercise_name} exercise form tutorial")
    return {
        'videoId': None,
        'url': f"https://www.youtube.com/embed?listType=search&list={query}",
        'channel': 'YouTube Search',
    }


def get_all_exercises() -> list:
    return [
        {
            'name': ' '.join(w.capitalize() for w in name.split()),
            'videoId': data['videoId'],
            'url': f"https://www.youtube.com/embed/{data['videoId']}",
            'channel': data['channel'],
        }
        for name, data in EXERCISE_VIDEOS.items()
    ]
