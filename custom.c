#include <stdio.h>
#include <string.h>
#include <stdlib.h>

char encoding_table[128] = {0};
void init()
{
  for (char c = 'A'; c <= 'Z'; c++)
  {
    encoding_table[(int)c] = c - 'A' + 1;
  }
  for (char c = 'a'; c <= 'z'; c++)
  {
    encoding_table[(int)c] = c - 'a' + 27;
  }
}

unsigned char *encode(const char *input, size_t *encoded_size)
{
  size_t input_length = strlen(input);
  size_t bit_length = input_length * 4;
  size_t byte_length = (bit_length + 7) / 8;
  unsigned char *encoded = (unsigned char *)calloc(byte_length, sizeof(unsigned char));
  *encoded_size = byte_length;
  int bit_position = 0;
  for (size_t i = 0; i < input_length; i++)
  {
    char code = encoding_table[(int)input[i]];
    int byte_index = bit_position / 8;
    int bit_offset = bit_position % 8;
    if (bit_offset <= 4)
    {
      encoded[byte_index] |= code << (4 - bit_offset);
    }
    else
    {
      encoded[byte_index] |= code >> (bit_offset - 4);
      encoded[byte_index + 1] |= code << (12 - bit_offset);
    }
    bit_position += 4;
  }
  return encoded;
}

int main()
{
  init();
  const char *input = "Hierarchy";
  printf("org word: %s\n", input);
  printf("org size: %zu bytes\n", strlen(input));
  size_t encoded_size;
  unsigned char *encoded = encode(input, &encoded_size);
  printf("encoded ");
  for (size_t i = 0; i < encoded_size; i++)
  {
    printf("%02x ", encoded[i]);
  }
  printf("\nsize %zu bytes\n", encoded_size);
  free(encoded);
  return 0;
}
