#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define DECK_SIZE 52
#define MAX_BOARD 5

typedef struct {
    int rank;   // 2 to 14
    int suit;   // 0 clubs, 1 diamonds, 2 hearts, 3 spades
} Card;

typedef struct {
    unsigned long long wins1;
    unsigned long long wins2;
    unsigned long long ties;
    unsigned long long total;
} EquityResult;

/*
    Score format:
    Higher score is better.

    Categories:
    8 = Straight Flush
    7 = Four of a Kind
    6 = Full House
    5 = Flush
    4 = Straight
    3 = Three of a Kind
    2 = Two Pair
    1 = One Pair
    0 = High Card

    Tie breakers are packed in base 15.
*/
long long pack_score(int category, int r1, int r2, int r3, int r4, int r5) {
    long long score = category;

    score = score * 15 + r1;
    score = score * 15 + r2;
    score = score * 15 + r3;
    score = score * 15 + r4;
    score = score * 15 + r5;

    return score;
}

int rank_value(char c) {
    c = toupper(c);

    if (c >= '2' && c <= '9') return c - '0';
    if (c == 'T') return 10;
    if (c == 'J') return 11;
    if (c == 'Q') return 12;
    if (c == 'K') return 13;
    if (c == 'A') return 14;

    return -1;
}

int suit_value(char c) {
    c = tolower(c);

    if (c == 'c') return 0;
    if (c == 'd') return 1;
    if (c == 'h') return 2;
    if (c == 's') return 3;

    return -1;
}

Card parse_card(const char *str) {
    Card c;

    if (strlen(str) < 2) {
        c.rank = -1;
        c.suit = -1;
        return c;
    }

    c.rank = rank_value(str[0]);
    c.suit = suit_value(str[1]);

    return c;
}

int same_card(Card a, Card b) {
    return a.rank == b.rank && a.suit == b.suit;
}

int card_index(Card c) {
    return (c.rank - 2) * 4 + c.suit;
}

Card index_to_card(int index) {
    Card c;

    c.rank = index / 4 + 2;
    c.suit = index % 4;

    return c;
}

int is_valid_card(Card c) {
    return c.rank >= 2 && c.rank <= 14 && c.suit >= 0 && c.suit <= 3;
}

void print_card(Card c) {
    char ranks[] = "--23456789TJQKA";
    char suits[] = "cdhs";

    printf("%c%c", ranks[c.rank], suits[c.suit]);
}

int find_straight_high(int present[]) {
    int r;

    for (r = 14; r >= 5; r--) {
        if (present[r] &&
            present[r - 1] &&
            present[r - 2] &&
            present[r - 3] &&
            present[r - 4]) {
            return r;
        }
    }

    // Wheel straight: A-2-3-4-5
    if (present[14] && present[5] && present[4] && present[3] && present[2]) {
        return 5;
    }

    return 0;
}

long long evaluate_5_cards(Card cards[5]) {
    int count[15] = {0};
    int present[15] = {0};
    int i, r;

    int flush = 1;
    int suit = cards[0].suit;

    for (i = 0; i < 5; i++) {
        count[cards[i].rank]++;
        present[cards[i].rank] = 1;

        if (cards[i].suit != suit) {
            flush = 0;
        }
    }

    int straight_high = find_straight_high(present);

    if (flush && straight_high) {
        return pack_score(8, straight_high, 0, 0, 0, 0);
    }

    int four = 0;
    int three = 0;
    int pairs[2] = {0};
    int pair_count = 0;
    int kickers[5] = {0};
    int kicker_count = 0;

    for (r = 14; r >= 2; r--) {
        if (count[r] == 4) {
            four = r;
        } else if (count[r] == 3) {
            three = r;
        } else if (count[r] == 2) {
            if (pair_count < 2) {
                pairs[pair_count++] = r;
            }
        } else if (count[r] == 1) {
            kickers[kicker_count++] = r;
        }
    }

    if (four) {
        return pack_score(7, four, kickers[0], 0, 0, 0);
    }

    if (three && pair_count >= 1) {
        return pack_score(6, three, pairs[0], 0, 0, 0);
    }

    if (flush) {
        int flush_ranks[5];
        int n = 0;

        for (r = 14; r >= 2; r--) {
            if (count[r]) {
                flush_ranks[n++] = r;
            }
        }

        return pack_score(
            5,
            flush_ranks[0],
            flush_ranks[1],
            flush_ranks[2],
            flush_ranks[3],
            flush_ranks[4]
        );
    }

    if (straight_high) {
        return pack_score(4, straight_high, 0, 0, 0, 0);
    }

    if (three) {
        return pack_score(3, three, kickers[0], kickers[1], 0, 0);
    }

    if (pair_count == 2) {
        return pack_score(2, pairs[0], pairs[1], kickers[0], 0, 0);
    }

    if (pair_count == 1) {
        return pack_score(1, pairs[0], kickers[0], kickers[1], kickers[2], 0);
    }

    return pack_score(0, kickers[0], kickers[1], kickers[2], kickers[3], kickers[4]);
}

long long evaluate_7_cards(Card cards[7]) {
    long long best = -1;

    Card five[5];

    for (int a = 0; a < 7; a++) {
        for (int b = a + 1; b < 7; b++) {
            int idx = 0;

            for (int i = 0; i < 7; i++) {
                if (i != a && i != b) {
                    five[idx++] = cards[i];
                }
            }

            long long score = evaluate_5_cards(five);

            if (score > best) {
                best = score;
            }
        }
    }

    return best;
}

void compare_hands(Card hand1[2], Card hand2[2], Card board[5], EquityResult *result) {
    Card seven1[7];
    Card seven2[7];

    seven1[0] = hand1[0];
    seven1[1] = hand1[1];

    seven2[0] = hand2[0];
    seven2[1] = hand2[1];

    for (int i = 0; i < 5; i++) {
        seven1[i + 2] = board[i];
        seven2[i + 2] = board[i];
    }

    long long score1 = evaluate_7_cards(seven1);
    long long score2 = evaluate_7_cards(seven2);

    if (score1 > score2) {
        result->wins1++;
    } else if (score2 > score1) {
        result->wins2++;
    } else {
        result->ties++;
    }

    result->total++;
}

void enumerate_boards_recursive(
    Card hand1[2],
    Card hand2[2],
    Card board[5],
    int board_count,
    Card deck[],
    int deck_count,
    int start,
    int needed,
    EquityResult *result
) {
    if (needed == 0) {
        compare_hands(hand1, hand2, board, result);
        return;
    }

    for (int i = start; i <= deck_count - needed; i++) {
        board[board_count] = deck[i];

        enumerate_boards_recursive(
            hand1,
            hand2,
            board,
            board_count + 1,
            deck,
            deck_count,
            i + 1,
            needed - 1,
            result
        );
    }
}

void calculate_equity(Card hand1[2], Card hand2[2], Card board[5], int board_count) {
    int used[DECK_SIZE] = {0};
    Card deck[DECK_SIZE];
    int deck_count = 0;

    used[card_index(hand1[0])] = 1;
    used[card_index(hand1[1])] = 1;
    used[card_index(hand2[0])] = 1;
    used[card_index(hand2[1])] = 1;

    for (int i = 0; i < board_count; i++) {
        used[card_index(board[i])] = 1;
    }

    for (int i = 0; i < DECK_SIZE; i++) {
        if (!used[i]) {
            deck[deck_count++] = index_to_card(i);
        }
    }

    EquityResult result = {0, 0, 0, 0};

    int needed = 5 - board_count;

    enumerate_boards_recursive(
        hand1,
        hand2,
        board,
        board_count,
        deck,
        deck_count,
        0,
        needed,
        &result
    );

    double hand1_equity = 0.0;
    double hand2_equity = 0.0;

    if (result.total > 0) {
        hand1_equity = ((double)result.wins1 + (double)result.ties / 2.0) / result.total * 100.0;
        hand2_equity = ((double)result.wins2 + (double)result.ties / 2.0) / result.total * 100.0;
    }

    printf("\nResults\n");
    printf("------\n");

    printf("Total runouts checked: %llu\n", result.total);
    printf("Hand 1 wins: %llu\n", result.wins1);
    printf("Hand 2 wins: %llu\n", result.wins2);
    printf("Ties:        %llu\n", result.ties);

    printf("\nHand 1 equity: %.2f%%\n", hand1_equity);
    printf("Hand 2 equity: %.2f%%\n", hand2_equity);
}

int has_duplicate(Card cards[], int count) {
    for (int i = 0; i < count; i++) {
        for (int j = i + 1; j < count; j++) {
            if (same_card(cards[i], cards[j])) {
                return 1;
            }
        }
    }

    return 0;
}

const char *street_name(int board_count) {
    if (board_count == 0) return "Preflop";
    if (board_count == 3) return "Flop";
    if (board_count == 4) return "Turn";
    if (board_count == 5) return "River";
    return "Invalid street";
}

int main(void) {
    char input[16];

    Card hand1[2];
    Card hand2[2];
    Card board[5];

    int board_count = 0;

    printf("Texas Hold'em Heads-Up Equity Calculator\n");
    printf("----------------------------------------\n");
    printf("Enter cards using format like As, Kh, Td, 9c.\n\n");

    // -----------------------------
    // Enter preflop hole cards
    // -----------------------------
    printf("Enter Hand 1 card 1: ");
    scanf("%15s", input);
    hand1[0] = parse_card(input);

    printf("Enter Hand 1 card 2: ");
    scanf("%15s", input);
    hand1[1] = parse_card(input);

    printf("Enter Hand 2 card 1: ");
    scanf("%15s", input);
    hand2[0] = parse_card(input);

    printf("Enter Hand 2 card 2: ");
    scanf("%15s", input);
    hand2[1] = parse_card(input);

    // -----------------------------
    // Validate preflop cards
    // -----------------------------
    Card all_cards[9];
    int total_known = 0;

    all_cards[total_known++] = hand1[0];
    all_cards[total_known++] = hand1[1];
    all_cards[total_known++] = hand2[0];
    all_cards[total_known++] = hand2[1];

    for (int i = 0; i < total_known; i++) {
        if (!is_valid_card(all_cards[i])) {
            printf("Error: invalid card entered.\n");
            return 1;
        }
    }

    if (has_duplicate(all_cards, total_known)) {
        printf("Error: duplicate card entered.\n");
        return 1;
    }

    // -----------------------------
    // Preflop equity
    // -----------------------------
    printf("\n==============================\n");
    printf("Street: Preflop\n");
    printf("==============================\n");

    printf("Hand 1: ");
    print_card(hand1[0]);
    printf(" ");
    print_card(hand1[1]);
    printf("\n");

    printf("Hand 2: ");
    print_card(hand2[0]);
    printf(" ");
    print_card(hand2[1]);
    printf("\n");

    calculate_equity(hand1, hand2, board, board_count);

    // -----------------------------
    // Enter flop cards
    // -----------------------------
    printf("\nEnter the flop cards.\n");

    for (int i = 0; i < 3; i++) {
        printf("Enter flop card %d: ", i + 1);
        scanf("%15s", input);
        board[board_count++] = parse_card(input);
    }

    // Validate cards after flop
    total_known = 0;

    all_cards[total_known++] = hand1[0];
    all_cards[total_known++] = hand1[1];
    all_cards[total_known++] = hand2[0];
    all_cards[total_known++] = hand2[1];

    for (int i = 0; i < board_count; i++) {
        all_cards[total_known++] = board[i];
    }

    for (int i = 0; i < total_known; i++) {
        if (!is_valid_card(all_cards[i])) {
            printf("Error: invalid card entered.\n");
            return 1;
        }
    }

    if (has_duplicate(all_cards, total_known)) {
        printf("Error: duplicate card entered.\n");
        return 1;
    }

    // -----------------------------
    // Flop equity
    // -----------------------------
    printf("\n==============================\n");
    printf("Street: Flop\n");
    printf("==============================\n");

    printf("Board: ");
    for (int i = 0; i < board_count; i++) {
        print_card(board[i]);
        printf(" ");
    }
    printf("\n");

    calculate_equity(hand1, hand2, board, board_count);

    // -----------------------------
    // Enter turn card
    // -----------------------------
    printf("\nEnter the turn card: ");
    scanf("%15s", input);
    board[board_count++] = parse_card(input);

    // Validate cards after turn
    total_known = 0;

    all_cards[total_known++] = hand1[0];
    all_cards[total_known++] = hand1[1];
    all_cards[total_known++] = hand2[0];
    all_cards[total_known++] = hand2[1];

    for (int i = 0; i < board_count; i++) {
        all_cards[total_known++] = board[i];
    }

    for (int i = 0; i < total_known; i++) {
        if (!is_valid_card(all_cards[i])) {
            printf("Error: invalid card entered.\n");
            return 1;
        }
    }

    if (has_duplicate(all_cards, total_known)) {
        printf("Error: duplicate card entered.\n");
        return 1;
    }

    // -----------------------------
    // Turn equity
    // -----------------------------
    printf("\n==============================\n");
    printf("Street: Turn\n");
    printf("==============================\n");

    printf("Board: ");
    for (int i = 0; i < board_count; i++) {
        print_card(board[i]);
        printf(" ");
    }
    printf("\n");

    calculate_equity(hand1, hand2, board, board_count);

    // -----------------------------
    // Enter river card
    // -----------------------------
    printf("\nEnter the river card: ");
    scanf("%15s", input);
    board[board_count++] = parse_card(input);

    // Validate cards after river
    total_known = 0;

    all_cards[total_known++] = hand1[0];
    all_cards[total_known++] = hand1[1];
    all_cards[total_known++] = hand2[0];
    all_cards[total_known++] = hand2[1];

    for (int i = 0; i < board_count; i++) {
        all_cards[total_known++] = board[i];
    }

    for (int i = 0; i < total_known; i++) {
        if (!is_valid_card(all_cards[i])) {
            printf("Error: invalid card entered.\n");
            return 1;
        }
    }

    if (has_duplicate(all_cards, total_known)) {
        printf("Error: duplicate card entered.\n");
        return 1;
    }

    // -----------------------------
    // River equity
    // -----------------------------
    printf("\n==============================\n");
    printf("Street: River\n");
    printf("==============================\n");

    printf("Board: ");
    for (int i = 0; i < board_count; i++) {
        print_card(board[i]);
        printf(" ");
    }
    printf("\n");

    calculate_equity(hand1, hand2, board, board_count);

    return 0;
}