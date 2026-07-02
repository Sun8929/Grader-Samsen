#include <stdio.h>
#include <string.h>

#define MAX_LEN 1000

// Helper function to return the maximum of two integers
int max(int a, int b) {
    return (a > b) ? a : b;
}

// Function to find the length of the Longest Common Subsequence (LCS)
int lcs(char *X, char *Y, int m, int n) {
    // dp[i][j] will store the LCS of X[0..i-1] and Y[0..j-1]
    static int dp[MAX_LEN + 1][MAX_LEN + 1];

    // Build the dp table in bottom-up fashion
    for (int i = 0; i <= m; i++) {
        for (int j = 0; j <= n; j++) {
            if (i == 0 || j == 0) {
                dp[i][j] = 0;
            } else if (X[i - 1] == Y[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // dp[m][n] contains the length of LCS for X[0..m-1] and Y[0..n-1]
    return dp[m][n];
}

int main() {
    char X[MAX_LEN];
    char Y[MAX_LEN];

    // Read the two strings (handling optional newline characters)
    if (scanf("%999s", X) != 1) return 0;
    if (scanf("%999s", Y) != 1) return 0;

    int m = strlen(X);
    int n = strlen(Y);

    printf("%d\n", lcs(X, Y, m, n));

    return 0;
}
