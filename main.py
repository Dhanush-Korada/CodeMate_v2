import argparse
import os
import sys
import traceback

from agent.tools import init_project_root


def main():
    parser = argparse.ArgumentParser(description="Run CodeMate Pro")
    parser.add_argument("command", nargs="?", default="cli", choices=["cli", "serve"],
                        help="Run mode: cli or serve")
    parser.add_argument("--recursion-limit", "-r", type=int, default=100,
                        help="Recursion limit for processing (default: 100)")
    parser.add_argument("--host", default="127.0.0.1", help="API host for serve mode")
    parser.add_argument("--port", type=int, default=5000, help="API port for serve mode")

    args = parser.parse_args()

    try:
        if args.command == "serve":
            from backend.api import app
            debug = os.getenv("CODEMATE_DEBUG", "false").lower() == "true"
            app.run(host=args.host, port=args.port, debug=debug, use_reloader=False)
            return

        init_project_root()
        from agent.graph import agent

        user_prompt = input("Enter your project prompt: ")
        result = agent.invoke(
            {"user_prompt": user_prompt},
            {"recursion_limit": args.recursion_limit}
        )
        print("Final State:", result)
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(0)
    except Exception as e:
        traceback.print_exc()
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
