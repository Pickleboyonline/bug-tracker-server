package a2;

/* NetIds: nnnn, nnnn.
 * What I thought about this assignment:
 *
 *
 *
 *  */

/** A collection of static functions. <br>
 * All methods assume that String parameters are non-null.
 *
 * If a method is called with arguments that do not satisfy the Preconditions,<br>
 * the behavior is undefined (the method can do anything). You do not have to use assert<br>
 * statements to test preconditions. We will not test with test cases that do <br>
 * not satisfy Preconditions. */
public class A2 {
	/* Each function you write has a "//TODO comment". Look on the right; click a blue
	 * rectangle to get to the corresponding "//TODO comment". DO NOT DELETE THESE COMMENTS.
	 * Put your code AFTER the comments.
	 *
	 * Wherever possible, prefer library functions to writing your own loops.
	 *
	 * The more complicated your loops become, the more important it is to
	 * explain the logic in comments.
	 *
	 * See the JavaHyperText entries for if-statement, while-loop, and for-loop.
	 * Use of the break-statement and continue-statement is discouraged but not
	 * forbidden. They make loops and programs harder to understand. Usually,
	 * they can be eliminated by restructuring/reorganizing code --perhaps writing
	 * extra methods.
	 *
	 * For some functions, you may be writing a loop to append character after
	 * character to an initially empty string. See the JavaHyperText entry for
	 * class StringBuilder and a discussion of why it may be better to use
	 * StringBuilder for this purpose. For this assignment, use either String or
	 * StringBuilder, it doesn't matter which you use.
	 *
	 * We give complete test cases except for the last two methods. You need practice
	 * in thinking about how to test well.
	 *  */

	/** Replace "-1" by the time you spent on A2 in hours.<br>
	 * Example: for 3 hours 15 minutes, use 3.25<br>
	 * Example: for 4 hours 30 minutes, use 4.50<br>
	 * Example: for 5 hours, use 5 or 5.0 */
	public static double timeSpent= -1;

	/** Return true iff (i.e. if and only if) the middle characters of s are different. <br>
	 * Note: If s has an odd number of chars, there is ONE middle char, so return false.<br>
	 * If s has an even number of chars, there are two middle chars, so return true only <br>
	 * if they are different.<br>
	 * Please look at the examples: <br>
	 * For s = "" return false <br>
	 * For s = "$" return false <br>
	 * For s = "23" return true <br>
	 * For s = "44" return false <br>
	 * For s = "22AB" return true <br>
	 * For s = "2AAB" return false <br>
	 * For s = "abcdefaabcdefg" return false <br>
	 * For s = "abcdef$abcdefg" return true <br>
	 * For s = "aaaaaaaaaaaaaaaa" return false <br>
	 * For s = "aaaaaaa$aaaaaaaa" return true<br>
	 * For s = "aaaaaaa$aaaaaaaaa" return false */
	public static boolean areMidsDiff(String s) {
		// TODO 1. Do not use a loop.
		// This can be done cleanly in 3-4 statements (but you can use more).
		// Hint: Follow these Principles:
		// Principle: Avoid unnecessary case analysis
		// Principle: Avoid the same expression in several places.
		// Principle: Keep the structure of the method as simple as possible.
		throw new UnsupportedOperationException();
	}

	/** Protect the letters in 'a'..'z' by surrounding each with '.' on the <br>
	 * left and the corresponding capital letter on the right. <br>
	 * That is: Return a copy of s changed as indicated above. <br>
	 * Examples: <br>
	 * For s = "", return "". <br>
	 * For s = "b", return "$.bB". <br>
	 * For s = "B", return "B". <br>
	 * For s = "å", return "å" <br>
	 * For s = "$", return "$" <br>
	 * For s = "1ABCDEFx", return "1ABCDEF.xX".<br>
	 * For s = "1zZ$Bby", return "1.zZZ$B.bB.yY"<br>
	 * For s = "abcdefghijk", <br>
	 * ......... return ".aA.bB.cC.dD.eE.fF.gG.Hh.iI.jJ.kK" */
	public static String protectLittles(String s) {
		/* TODO 2.
		 * 1. The spec does NOT say to handle all lower-case letters
		 * differently from the rest, but only those in 'a'..'z'.
		 * There are others lower-case letters!
		 *
		 * 2. In the fourth example, s = "å", 'å' is NOT a character in
		 * a..z, so it is NOT surrounded by anything in the result.
		 *
		 * If this isn't working for you, you may be using Eclipse on a
		 * Windows 10 computer, and the wrong Text File coding is being used.
		 * Everyone, please check that you are using the right one by using menu
		 * item Preferences -> General -> Workspace and selecting UTF-8.
		 *
		 *You can read about text-file encodings in JavaHyperText here:
		 *   https://www.cs.cornell.edu/courses/JavaAndDS/eclipse/Ecl01eclipse.html
		 *
		 * You will lose all points on this question if your code handles
		 * all lower-case letters and not just those in a..z.
		 *
		 * 3. Do NOT use "magic numbers" ---look that term up in JavaHyperText.
		 * For example, the internal representation of 'a' is 97, but do NOT
		 * use 97 in the method body.
		 */

		throw new UnsupportedOperationException();
	}

	/** Return s but with all letters in 'A'..'Z' moved to the back, <br>
	 * and in the same order.<br>
	 * Examples: <br>
	 * putCapsLast("") = "" <br>
	 * putCapsLast("$") = "$" <br>
	 * putCapsLast("Ac") = "cA" <br>
	 * putCapsLast("Åc") = "Åc" <br>
	 * Note: 'Å' is not in 'A'..'Z'. <br>
	 * putCapsLast("aAbBcCdDxXy$zZ") = "abcdxy$zABCDxZ" <br>
	 * putCapsLast("mnopqrst") = "mnopqrst" <br>
	 * putCapsLast("1z$aàēĤƀ") = "za1$bàēĤƀ" <br>
	 * putCapsLast("ABCDE.FGHIJKLMNO$PQ%RSTUV!WXYZ") = ".$%!ABCDEFGHIJKLMNOPQRSTUVWXYZ" */
	public static String putCapsLast(String s) {
		// TODO 3. The same things about the UTF-8 encoding magic numbers
		// discussed in the previous method apply here also.

		throw new UnsupportedOperationException();
	}

	/** Precondition: s and s1 are not null. <br>
	 * Return true iff s contains exactly one occurrence of s1. <br>
	 * Examples: exactly1("", "") is true <br>
	 * exactly1("a", "") is false: <br>
	 * .... The empty string occurs before and after each character! <br>
	 *
	 * exactly1("abc", "") is false <br>
	 * exactly1("", "a") is false. <br>
	 * exactly1("abcb", "c") is true. <br>
	 * exactly1("acbc", "c") is false. <br>
	 * exactly1("abbc", "ab") is true. <br>
	 * exactly1("aaa", "aa") is false. <br>
	 * exactly1("abbbabc", "ab") is false. */
	public static boolean exactly1(String s, String s1) {
		// TODO 4 Do not use a loop or recursion. Instead, look through the
		// methods of class String and see how you can tell that the first
		// and last occurrences of s1 in s are the same occurrence. Be sure
		// you handle correctly the case that s1 does not occur in s.
		//
		// Hint: Follow this Principle:
		// Principle: Be aware of efficiency considerations.
		// Don't repeat expensive work that has already been done.
		// Note that a call like s.indexOf(s1) may take time proportional to the
		// length of string s. If s contains 1,000 characters and s1 contains 5 chars,
		// then about 9996 tests may have to be made in the worst case. So don't
		// have the same method call executed several times.
		throw new UnsupportedOperationException();
	}

	/** Return true iff s and t are anagrams.<br>
	 * Note: 2 strings are anagrams of each other if swapping the characters<br>
	 * around in one changes it into the other.<br>
	 * Note: 'a' and 'A' are different chars, and the space ' ' is a character.
	 *
	 * Examples: For s = "noon", t = "noon", return true. <br>
	 * For s = "mary", t = "army", return true. <br>
	 * For s = "tom marvolo riddle", t = "i am lordvoldemort", return true. <br>
	 * For s = "tommarvoloriddle", t = "i am lordvoldemort", return false. <br>
	 * For s = "hello", t = "world", return false. */
	public static boolean areAnagrams(String s, String t) {
		// TODO 5
		/* Do not use a loop or recursion! This can be done in
		 * 5 lines using methods of classes String and Arrays
		 * (https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/Arrays.html).
		 * Hint: how can a sequence of characters be uniquely ordered? You might
		 * need to first convert the string into an array of characters and then
		 * use methods in class Arrays. */
		throw new UnsupportedOperationException();
	}

	/** Return n if s consists of n >= 0 catenations of x with itself. <br>
	 * Otherwise, return -1.<br>
	 * Examples: <br>
	 * For nCat("", "") return 0<br>
	 * For nCat("", "fg") return 0 ("" is "gf" catenated with itself 0 times)<br>
	 * For nCat("xxx", "") return -1<br>
	 * For nCat("x", "x") return 1<br>
	 * For nCat("xx", "x") return 2 <br>
	 * For nCat("ccbbbb", "bb") return -1 <br>
	 * For nCat("bbbbcc", "bb") return -1 <br>
	 * For nCat("bbbbbb", "bb") return 3 <br>
	 * For nCat("bbbbbb", "bbb") return 2 <br>
	 * For nCat("bbbbbb", "bbbb") return -1 <br>
	 * For nCat("bbbbbb", "bbbbb") eturn -1 <br>
	 * For nCat("bbbbbb", "bbbbbb") return 1 <br>
	 * For nCat("bbbbbb", "bbbbbbb") return -1 <br>
	 * For nCat("xyzxyz", "xyz") return 2 <br>
	 * For nCat("xyzxyz", "xyzxyz") return 1 <br>
	 * For nCat(s, s) (for any s not the empty string) return 1 */
	public static int nCat(String s, String x) {
		// TODO 6. Directive. Do NOT create an array of chars. It's easily
		// done using the two strings s and x and perhaps a few local variables.
		// Hint: Follow this Principle:
		// Make the structure of a loop reflect the structure of the data it processes.
		// Use function equals, not ==, to test equality of strings.
		throw new UnsupportedOperationException();
	}

	/** Return the length of the shortest substring x of s <br>
	 * such that s = x + x + ... + x. <br>
	 * Examples: <br>
	 * For s = "" return 0<br>
	 * For s = "xxxxxxxxx" return 1 <br>
	 * For s = "xyxyxyxy" return 2 <br>
	 * For s = "012012012012" return 3 <br>
	 * For s = "hellohellohello" return 5 <br>
	 * For s = "hellohelloworld" return 15 <br>
	 * For s = "hellohell" return 9 */
	public static int shortest(String s) {
		// TODO 7.
		// 1. To implement this one, start checking for the shortest
		// substring with length 0, then 1, then 2, then ..., and stop when
		// the answer is found. To make each of those checks,
		// use the previous method nCat.
		//
		// 2. If the answer is found within a loop body, the method should return
		// within the loop body. That is far better than using a break statement
		// and then fiddling after the loop to figure out what to return.

		// 3. Note that nCat(s, s) = 1, for any nonempty s.
		throw new UnsupportedOperationException();
	}
}
